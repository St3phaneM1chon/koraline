/**
 * E911 Emergency Calling via Telnyx
 * Handles emergency location registration, E911 address validation,
 * and emergency call routing for regulatory compliance.
 */

import { logger } from '@/lib/logger';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface E911Address {
  firstName: string;
  lastName: string;
  streetAddress: string;
  extendedAddress?: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  countryCode: string; // CA or US
}

export interface E911Registration {
  id?: string;
  phoneNumberId: string;
  phoneNumber: string;
  address: E911Address;
  status: 'pending' | 'active' | 'failed' | 'expired';
  registeredAt?: Date;
  expiresAt?: Date;
  error?: string;
}

export interface E911ValidationResult {
  valid: boolean;
  correctedAddress?: E911Address;
  errors: string[];
}

// ─── Emergency Numbers ──────────────────────────────────────────────────────

const EMERGENCY_NUMBERS: Record<string, string[]> = {
  CA: ['911', '112'],
  US: ['911', '112'],
};

// ─── Functions ──────────────────────────────────────────────────────────────

/**
 * Check if a dialed number is an emergency number.
 */
export function isEmergencyNumber(number: string, country = 'CA'): boolean {
  const cleaned = number.replace(/[^0-9]/g, '');
  const numbers = EMERGENCY_NUMBERS[country] ?? EMERGENCY_NUMBERS.CA;
  return numbers.includes(cleaned);
}

/**
 * Validate an E911 address with Telnyx.
 */
export async function validateE911Address(
  address: E911Address
): Promise<E911ValidationResult> {
  const telnyx = await import('@/lib/telnyx');

  try {
    const result = await telnyx.telnyxFetch<{
      valid?: boolean;
      corrected_address?: Record<string, string>;
      errors?: string[];
    }>('/emergency_addresses/validate', {
      method: 'POST',
      body: {
        first_name: address.firstName,
        last_name: address.lastName,
        street_address: address.streetAddress,
        extended_address: address.extendedAddress,
        locality: address.city,
        administrative_area: address.stateProvince,
        postal_code: address.postalCode,
        country_code: address.countryCode,
      },
    });

    if (result.data?.valid) {
      return {
        valid: true,
        correctedAddress: result.data.corrected_address
          ? mapTelnyxAddress(result.data.corrected_address)
          : undefined,
        errors: [],
      };
    }

    return {
      valid: false,
      errors: result.data?.errors ?? ['Address validation failed'],
    };
  } catch (error) {
    logger.error('E911 address validation failed', { error });
    return {
      valid: false,
      errors: [error instanceof Error ? error.message : 'Validation request failed'],
    };
  }
}

/**
 * Register an E911 address for a phone number.
 */
export async function registerE911(
  phoneNumberId: string,
  address: E911Address
): Promise<E911Registration> {
  const telnyx = await import('@/lib/telnyx');

  try {
    // First, create the emergency address
    const addrResult = await telnyx.telnyxFetch<{ id?: string }>('/emergency_addresses', {
      method: 'POST',
      body: {
        first_name: address.firstName,
        last_name: address.lastName,
        street_address: address.streetAddress,
        extended_address: address.extendedAddress,
        locality: address.city,
        administrative_area: address.stateProvince,
        postal_code: address.postalCode,
        country_code: address.countryCode,
      },
    });

    const emergencyAddressId = addrResult.data?.id;
    if (!emergencyAddressId) {
      throw new Error('Failed to create emergency address');
    }

    // Then associate it with the phone number
    await telnyx.telnyxFetch(`/phone_numbers/${phoneNumberId}`, {
      method: 'PATCH',
      body: {
        emergency_address_id: emergencyAddressId,
        emergency_enabled: true,
      },
    });

    // Get phone number details for the record
    const phoneResult = await telnyx.telnyxFetch<{ phone_number?: string }>(`/phone_numbers/${phoneNumberId}`);

    const registration: E911Registration = {
      id: emergencyAddressId,
      phoneNumberId,
      phoneNumber: phoneResult.data?.phone_number ?? '',
      address,
      status: 'active',
      registeredAt: new Date(),
    };

    logger.info('E911 registration successful', {
      phoneNumberId,
      emergencyAddressId,
    });

    return registration;
  } catch (error) {
    logger.error('E911 registration failed', { phoneNumberId, error });
    return {
      phoneNumberId,
      phoneNumber: '',
      address,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Registration failed',
    };
  }
}

/**
 * Get E911 registration status for a phone number.
 */
export async function getE911Status(
  phoneNumberId: string
): Promise<E911Registration | null> {
  const telnyx = await import('@/lib/telnyx');

  try {
    const result = await telnyx.telnyxFetch<{
      emergency_address_id?: string;
      phone_number?: string;
      emergency_enabled?: boolean;
    }>(`/phone_numbers/${phoneNumberId}`);
    const data = result.data;

    if (!data?.emergency_address_id) {
      return null;
    }

    // Get the emergency address details
    const addrResult = await telnyx.telnyxFetch<
      Record<string, string> & { created_at?: string }
    >(
      `/emergency_addresses/${data.emergency_address_id}`
    );
    const addr = addrResult.data;

    return {
      id: data.emergency_address_id,
      phoneNumberId,
      phoneNumber: data.phone_number ?? '',
      address: addr ? mapTelnyxAddress(addr) : {
        firstName: '',
        lastName: '',
        streetAddress: '',
        city: '',
        stateProvince: '',
        postalCode: '',
        countryCode: 'CA',
      },
      status: data.emergency_enabled ? 'active' : 'pending',
      registeredAt: addr?.created_at ? new Date(addr.created_at) : undefined,
    };
  } catch (error) {
    logger.error('Failed to get E911 status', { phoneNumberId, error });
    return null;
  }
}

/**
 * Handle an emergency call - ensure E911 is active and route properly.
 * Should be called BEFORE standard call routing when emergency number detected.
 */
export async function handleEmergencyCall(
  callControlId: string,
  callerPhoneNumberId: string
): Promise<{ allowed: boolean; warning?: string }> {
  const registration = await getE911Status(callerPhoneNumberId);

  if (!registration || registration.status !== 'active') {
    logger.warn('Emergency call without E911 registration', {
      callControlId,
      callerPhoneNumberId,
      registrationStatus: registration?.status ?? 'none',
    });

    return {
      allowed: true, // Never block emergency calls
      warning: 'E911 address not registered. Emergency services may not have your location.',
    };
  }

  logger.info('Emergency call with E911 registration', {
    callControlId,
    registrationId: registration.id,
  });

  return { allowed: true };
}

/**
 * Remove E911 registration from a phone number.
 */
export async function removeE911(phoneNumberId: string): Promise<boolean> {
  const telnyx = await import('@/lib/telnyx');

  try {
    await telnyx.telnyxFetch(`/phone_numbers/${phoneNumberId}`, {
      method: 'PATCH',
      body: {
        emergency_enabled: false,
      },
    });

    logger.info('E911 registration removed', { phoneNumberId });
    return true;
  } catch (error) {
    logger.error('Failed to remove E911', { phoneNumberId, error });
    return false;
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function mapTelnyxAddress(data: Record<string, string>): E911Address {
  return {
    firstName: data.first_name ?? '',
    lastName: data.last_name ?? '',
    streetAddress: data.street_address ?? '',
    extendedAddress: data.extended_address,
    city: data.locality ?? '',
    stateProvince: data.administrative_area ?? '',
    postalCode: data.postal_code ?? '',
    countryCode: data.country_code ?? 'CA',
  };
}
