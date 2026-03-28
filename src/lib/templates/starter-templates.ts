/**
 * STARTER TEMPLATES — Pre-built page templates for the Template Marketplace.
 *
 * Each template is a pre-configured array of sections using the section types
 * from PageRenderer (text, features, cta, stats, testimonial, faq, image).
 *
 * Templates are seeded as system templates (isSystem: true) and cannot be deleted.
 * Tenants can clone them to create custom variations.
 */

// ── Section type (mirrors PageRenderer.PageSection) ─────────────────

export interface TemplateSection {
  id: string;
  type: 'text' | 'features' | 'cta' | 'stats' | 'testimonial' | 'faq' | 'image';
  title?: string;
  subtitle?: string;
  content?: string;
  items?: Array<{
    icon?: string;
    title?: string;
    description?: string;
    value?: string;
    label?: string;
    href?: string;
  }>;
  imageUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
}

// ── Template definition ─────────────────────────────────────────────

export interface StarterTemplate {
  slug: string;
  name: string;
  description: string;
  category: string;
  thumbnail: string | null;
  sections: TemplateSection[];
}

// ── Category constants ──────────────────────────────────────────────

export const TEMPLATE_CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'business', label: 'Business' },
  { value: 'portfolio', label: 'Portfolio' },
  { value: 'landing', label: 'Landing Page' },
  { value: 'blog', label: 'Blog' },
  { value: 'event', label: 'Event' },
  { value: 'ecommerce', label: 'E-Commerce' },
  { value: 'support', label: 'Support' },
] as const;

export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number]['value'];

// ── 12 Starter Templates ────────────────────────────────────────────

export const STARTER_TEMPLATES: StarterTemplate[] = [
  // 1. Blank
  {
    slug: 'blank',
    name: 'Blank Page',
    description: 'Start from scratch with an empty page.',
    category: 'general',
    thumbnail: null,
    sections: [],
  },

  // 2. Business Home
  {
    slug: 'business-home',
    name: 'Business Home',
    description: 'Professional homepage with hero, features, team highlights, and call-to-action.',
    category: 'business',
    thumbnail: null,
    sections: [
      {
        id: 'hero-text',
        type: 'text',
        title: 'Welcome to Our Business',
        content:
          '<p>We deliver innovative solutions that help businesses grow. Our team of experts is dedicated to providing the best service in the industry.</p>',
      },
      {
        id: 'features',
        type: 'features',
        title: 'What We Offer',
        items: [
          { icon: '🚀', title: 'Fast Delivery', description: 'Quick turnaround on all projects and orders.' },
          { icon: '🛡️', title: 'Reliable Service', description: 'Dependable solutions you can count on.' },
          { icon: '💡', title: 'Innovation', description: 'Cutting-edge technology and creative approaches.' },
          { icon: '🤝', title: 'Partnership', description: 'We work alongside you as a true partner.' },
          { icon: '📊', title: 'Data-Driven', description: 'Decisions backed by analytics and insights.' },
          { icon: '🌍', title: 'Global Reach', description: 'Serving clients across the globe.' },
        ],
      },
      {
        id: 'stats',
        type: 'stats',
        title: 'Our Impact',
        items: [
          { value: '500+', label: 'Clients Served' },
          { value: '98%', label: 'Satisfaction Rate' },
          { value: '15+', label: 'Years Experience' },
          { value: '24/7', label: 'Support' },
        ],
      },
      {
        id: 'cta',
        type: 'cta',
        title: 'Ready to Get Started?',
        subtitle: 'Contact us today to discuss your project.',
        ctaText: 'Contact Us',
        ctaUrl: '/contact',
      },
    ],
  },

  // 3. Portfolio
  {
    slug: 'portfolio',
    name: 'Portfolio',
    description: 'Showcase your work with a gallery, about section, and contact info.',
    category: 'portfolio',
    thumbnail: null,
    sections: [
      {
        id: 'intro',
        type: 'text',
        title: 'Our Portfolio',
        content:
          '<p>Explore our latest projects and creative work. Each piece represents our commitment to excellence and attention to detail.</p>',
      },
      {
        id: 'gallery',
        type: 'image',
        title: 'Featured Work',
        imageUrl: '/images/placeholder-portfolio.jpg',
      },
      {
        id: 'about',
        type: 'text',
        title: 'About Us',
        content:
          '<p>We are a creative studio specializing in design, development, and digital experiences. Our multidisciplinary team brings ideas to life with passion and precision.</p>',
      },
      {
        id: 'cta',
        type: 'cta',
        title: 'Like What You See?',
        subtitle: 'Let us bring your vision to life.',
        ctaText: 'Start a Project',
        ctaUrl: '/contact',
      },
    ],
  },

  // 4. Landing Page
  {
    slug: 'landing-page',
    name: 'Landing Page',
    description: 'High-conversion landing page with hero, stats, features, testimonials, and CTA.',
    category: 'landing',
    thumbnail: null,
    sections: [
      {
        id: 'hero',
        type: 'text',
        title: 'Transform Your Business Today',
        content:
          '<p>Join thousands of companies already using our platform to accelerate growth, reduce costs, and delight customers.</p>',
      },
      {
        id: 'stats',
        type: 'stats',
        title: 'Trusted by Industry Leaders',
        items: [
          { value: '10K+', label: 'Active Users' },
          { value: '99.9%', label: 'Uptime' },
          { value: '50M+', label: 'Transactions' },
          { value: '4.9/5', label: 'Rating' },
        ],
      },
      {
        id: 'features',
        type: 'features',
        title: 'Why Choose Us',
        items: [
          { icon: '⚡', title: 'Lightning Fast', description: 'Optimized performance for the best user experience.' },
          { icon: '🔒', title: 'Enterprise Security', description: 'Bank-grade encryption and compliance built in.' },
          { icon: '📱', title: 'Mobile First', description: 'Works beautifully on every device and screen size.' },
        ],
      },
      {
        id: 'testimonial',
        type: 'text',
        title: 'What Our Customers Say',
        content:
          '<blockquote>"This platform completely transformed how we operate. The ROI was visible within the first month."</blockquote><p><strong>— Jane Doe, CEO at TechCorp</strong></p>',
      },
      {
        id: 'cta',
        type: 'cta',
        title: 'Start Your Free Trial',
        subtitle: 'No credit card required. Cancel anytime.',
        ctaText: 'Get Started Free',
        ctaUrl: '/signup',
      },
    ],
  },

  // 5. About Us
  {
    slug: 'about-us',
    name: 'About Us',
    description: 'Tell your story with hero, company narrative, team section, values, and CTA.',
    category: 'business',
    thumbnail: null,
    sections: [
      {
        id: 'story',
        type: 'text',
        title: 'Our Story',
        content:
          '<p>Founded with a simple mission: to make quality accessible to everyone. What started as a small team with a big idea has grown into a company trusted by thousands worldwide.</p><p>Our journey has been defined by innovation, perseverance, and an unwavering commitment to our customers.</p>',
      },
      {
        id: 'team',
        type: 'features',
        title: 'Meet the Team',
        items: [
          { icon: '👤', title: 'Alex Johnson', description: 'CEO & Co-Founder — Visionary leader with 20 years in tech.' },
          { icon: '👤', title: 'Sarah Chen', description: 'CTO — Engineering expert driving our technical innovation.' },
          { icon: '👤', title: 'Marcus Rivera', description: 'COO — Operations guru ensuring seamless delivery.' },
          { icon: '👤', title: 'Emily Park', description: 'VP Design — Creative force behind our brand and UX.' },
        ],
      },
      {
        id: 'values',
        type: 'features',
        title: 'Our Values',
        items: [
          { icon: '🎯', title: 'Customer First', description: 'Every decision starts with our customers in mind.' },
          { icon: '🌱', title: 'Continuous Growth', description: 'We learn, adapt, and improve every day.' },
          { icon: '🤲', title: 'Transparency', description: 'Open communication builds trust and lasting relationships.' },
        ],
      },
      {
        id: 'cta',
        type: 'cta',
        title: 'Join Our Journey',
        subtitle: 'We are always looking for talented people to join our team.',
        ctaText: 'View Careers',
        ctaUrl: '/careers',
      },
    ],
  },

  // 6. Contact
  {
    slug: 'contact',
    name: 'Contact',
    description: 'Contact page with form prompt, location info, and FAQ.',
    category: 'business',
    thumbnail: null,
    sections: [
      {
        id: 'intro',
        type: 'text',
        title: 'Get in Touch',
        content:
          '<p>We would love to hear from you. Whether you have a question about our services, pricing, or anything else, our team is ready to answer.</p>',
      },
      {
        id: 'contact-info',
        type: 'features',
        title: 'Contact Information',
        items: [
          { icon: '📧', title: 'Email', description: 'hello@yourcompany.com' },
          { icon: '📞', title: 'Phone', description: '+1 (555) 123-4567' },
          { icon: '📍', title: 'Address', description: '123 Business Ave, Suite 100, City, State 12345' },
          { icon: '🕐', title: 'Hours', description: 'Monday – Friday, 9 AM – 5 PM EST' },
        ],
      },
      {
        id: 'faq',
        type: 'text',
        title: 'Frequently Asked Questions',
        content:
          '<p><strong>How quickly do you respond?</strong><br/>We typically respond within 24 business hours.</p><p><strong>Do you offer phone support?</strong><br/>Yes, during business hours. For after-hours inquiries, email is preferred.</p><p><strong>Where are you located?</strong><br/>Our main office is downtown, but we serve clients globally.</p>',
      },
    ],
  },

  // 7. Pricing
  {
    slug: 'pricing',
    name: 'Pricing',
    description: 'Pricing page with plan comparison, FAQ, and conversion CTA.',
    category: 'landing',
    thumbnail: null,
    sections: [
      {
        id: 'intro',
        type: 'text',
        title: 'Simple, Transparent Pricing',
        content:
          '<p>Choose the plan that fits your needs. All plans include a 14-day free trial with no credit card required.</p>',
      },
      {
        id: 'plans',
        type: 'features',
        title: 'Our Plans',
        items: [
          { icon: '🌱', title: 'Starter — $29/mo', description: 'Perfect for small teams. Includes 5 users, basic features, and email support.' },
          { icon: '🚀', title: 'Professional — $79/mo', description: 'For growing businesses. Unlimited users, advanced features, and priority support.' },
          { icon: '🏢', title: 'Enterprise — Custom', description: 'For large organizations. Custom features, dedicated account manager, and SLA.' },
        ],
      },
      {
        id: 'faq',
        type: 'text',
        title: 'Pricing FAQ',
        content:
          '<p><strong>Can I change plans later?</strong><br/>Yes, you can upgrade or downgrade at any time.</p><p><strong>Is there a long-term contract?</strong><br/>No, all plans are month-to-month. Cancel anytime.</p><p><strong>Do you offer discounts?</strong><br/>Annual billing saves you 20%. Non-profits get an additional 15% off.</p>',
      },
      {
        id: 'cta',
        type: 'cta',
        title: 'Start Your Free Trial',
        subtitle: 'Try any plan free for 14 days.',
        ctaText: 'Get Started',
        ctaUrl: '/signup',
      },
    ],
  },

  // 8. Blog Post
  {
    slug: 'blog-post',
    name: 'Blog Post',
    description: 'Article layout with hero text, rich content area, and newsletter CTA.',
    category: 'blog',
    thumbnail: null,
    sections: [
      {
        id: 'article-content',
        type: 'text',
        title: 'Your Article Title Here',
        content:
          '<p>Write your article content here. Use headings, paragraphs, lists, and other rich text formatting to create engaging blog posts.</p><h3>Section Heading</h3><p>Break your content into clear sections with descriptive headings. This helps readers scan and find the information they need.</p><h3>Key Takeaways</h3><ul><li>First important point</li><li>Second important point</li><li>Third important point</li></ul>',
      },
      {
        id: 'newsletter',
        type: 'cta',
        title: 'Enjoyed This Article?',
        subtitle: 'Subscribe to our newsletter for more insights delivered to your inbox.',
        ctaText: 'Subscribe',
        ctaUrl: '/newsletter',
      },
    ],
  },

  // 9. Event
  {
    slug: 'event',
    name: 'Event',
    description: 'Event page with countdown info, feature highlights, and registration CTA.',
    category: 'event',
    thumbnail: null,
    sections: [
      {
        id: 'event-intro',
        type: 'text',
        title: 'Annual Conference 2026',
        content:
          '<p>Join us for the most anticipated event of the year. Three days of keynotes, workshops, and networking opportunities with industry leaders.</p>',
      },
      {
        id: 'event-stats',
        type: 'stats',
        title: 'Event Highlights',
        items: [
          { value: '50+', label: 'Speakers' },
          { value: '3', label: 'Days' },
          { value: '2000+', label: 'Attendees' },
          { value: '100+', label: 'Sessions' },
        ],
      },
      {
        id: 'tracks',
        type: 'features',
        title: 'Conference Tracks',
        items: [
          { icon: '💻', title: 'Technology', description: 'Latest trends in AI, cloud, and development.' },
          { icon: '📈', title: 'Business', description: 'Growth strategies, leadership, and innovation.' },
          { icon: '🎨', title: 'Design', description: 'UX research, design systems, and accessibility.' },
          { icon: '🔬', title: 'Research', description: 'Academic papers and breakthrough discoveries.' },
        ],
      },
      {
        id: 'register',
        type: 'cta',
        title: 'Reserve Your Spot',
        subtitle: 'Early-bird pricing ends soon. Limited seats available.',
        ctaText: 'Register Now',
        ctaUrl: '/register',
      },
    ],
  },

  // 10. Product Showcase
  {
    slug: 'product-showcase',
    name: 'Product Showcase',
    description: 'Product page with gallery, features, specs, pricing, and purchase CTA.',
    category: 'ecommerce',
    thumbnail: null,
    sections: [
      {
        id: 'product-hero',
        type: 'image',
        title: 'Product Name',
        imageUrl: '/images/placeholder-product.jpg',
      },
      {
        id: 'product-desc',
        type: 'text',
        title: 'About This Product',
        content:
          '<p>Discover our flagship product, designed with precision and built to last. Every detail has been carefully considered to deliver an exceptional experience.</p>',
      },
      {
        id: 'product-features',
        type: 'features',
        title: 'Key Features',
        items: [
          { icon: '✨', title: 'Premium Quality', description: 'Crafted from the finest materials available.' },
          { icon: '🔧', title: 'Easy to Use', description: 'Intuitive design that works right out of the box.' },
          { icon: '♻️', title: 'Sustainable', description: 'Eco-friendly manufacturing and packaging.' },
          { icon: '🏆', title: 'Award-Winning', description: 'Recognized for excellence in design and innovation.' },
        ],
      },
      {
        id: 'product-stats',
        type: 'stats',
        title: 'Specifications',
        items: [
          { value: '99.5%', label: 'Purity' },
          { value: '500mg', label: 'Per Serving' },
          { value: '60', label: 'Servings' },
          { value: 'GMP', label: 'Certified' },
        ],
      },
      {
        id: 'product-cta',
        type: 'cta',
        title: 'Order Today',
        subtitle: 'Free shipping on orders over $50. 30-day money-back guarantee.',
        ctaText: 'Add to Cart',
        ctaUrl: '/shop',
      },
    ],
  },

  // 11. FAQ Page
  {
    slug: 'faq-page',
    name: 'FAQ Page',
    description: 'Comprehensive FAQ page with categorized questions and contact CTA.',
    category: 'support',
    thumbnail: null,
    sections: [
      {
        id: 'faq-intro',
        type: 'text',
        title: 'Frequently Asked Questions',
        content:
          '<p>Find answers to the most common questions about our products and services. Can\'t find what you\'re looking for? Contact our support team.</p>',
      },
      {
        id: 'faq-general',
        type: 'text',
        title: 'General Questions',
        content:
          '<p><strong>What is your return policy?</strong><br/>We offer a 30-day no-questions-asked return policy on all products.</p><p><strong>How do I track my order?</strong><br/>Once shipped, you will receive an email with a tracking link.</p><p><strong>Do you ship internationally?</strong><br/>Yes, we ship to over 50 countries worldwide.</p>',
      },
      {
        id: 'faq-billing',
        type: 'text',
        title: 'Billing & Payments',
        content:
          '<p><strong>What payment methods do you accept?</strong><br/>We accept Visa, Mastercard, Amex, PayPal, and Apple Pay.</p><p><strong>Can I get an invoice?</strong><br/>Invoices are automatically sent to your email after purchase.</p><p><strong>Is my payment information secure?</strong><br/>Yes, we use PCI-compliant payment processing with end-to-end encryption.</p>',
      },
      {
        id: 'faq-contact',
        type: 'cta',
        title: 'Still Have Questions?',
        subtitle: 'Our support team is available 24/7 to help you.',
        ctaText: 'Contact Support',
        ctaUrl: '/contact',
      },
    ],
  },

  // 12. Team Page
  {
    slug: 'team-page',
    name: 'Team Page',
    description: 'Team directory with bios, company values, and hiring CTA.',
    category: 'business',
    thumbnail: null,
    sections: [
      {
        id: 'team-intro',
        type: 'text',
        title: 'Our Team',
        content:
          '<p>Behind every great product is a great team. Meet the passionate people who make it all happen.</p>',
      },
      {
        id: 'leadership',
        type: 'features',
        title: 'Leadership',
        items: [
          { icon: '👤', title: 'Jordan Lee', description: 'Chief Executive Officer — Driving the company vision and strategy.' },
          { icon: '👤', title: 'Taylor Kim', description: 'Chief Technology Officer — Building the future of our platform.' },
          { icon: '👤', title: 'Riley Zhang', description: 'Chief Marketing Officer — Growing our brand and community.' },
          { icon: '👤', title: 'Casey Morgan', description: 'Chief Financial Officer — Ensuring sustainable growth.' },
        ],
      },
      {
        id: 'departments',
        type: 'features',
        title: 'Our Departments',
        items: [
          { icon: '💻', title: 'Engineering', description: '25 engineers building scalable, reliable software.' },
          { icon: '🎨', title: 'Design', description: '8 designers crafting intuitive user experiences.' },
          { icon: '📣', title: 'Marketing', description: '12 marketers spreading the word and growing the community.' },
          { icon: '🎧', title: 'Support', description: '15 support specialists ensuring customer success.' },
        ],
      },
      {
        id: 'values',
        type: 'features',
        title: 'What We Stand For',
        items: [
          { icon: '💪', title: 'Excellence', description: 'We hold ourselves to the highest standards in everything we do.' },
          { icon: '🌐', title: 'Diversity', description: 'We believe diverse perspectives make us stronger and more innovative.' },
          { icon: '🤝', title: 'Collaboration', description: 'Great things happen when we work together toward a shared goal.' },
        ],
      },
      {
        id: 'careers',
        type: 'cta',
        title: 'Join Our Team',
        subtitle: 'We are growing and looking for talented people like you.',
        ctaText: 'View Open Positions',
        ctaUrl: '/careers',
      },
    ],
  },

  // 13. Portfolio Gallery (G29)
  {
    slug: 'portfolio-gallery',
    name: 'Portfolio Gallery',
    description: 'Masonry gallery portfolio with category filters, lightbox, and project details.',
    category: 'portfolio',
    thumbnail: null,
    sections: [
      {
        id: 'hero',
        type: 'text',
        title: 'Our Work',
        content:
          '<p>A curated selection of our projects. Filter by category, click to explore full case studies.</p>',
      },
      {
        id: 'gallery',
        type: 'image',
        title: 'Featured Projects',
        imageUrl: '/images/placeholder-portfolio.jpg',
      },
      {
        id: 'project-types',
        type: 'features',
        title: 'What We Do',
        items: [
          { icon: '🎨', title: 'Branding', description: 'Visual identity and brand systems.' },
          { icon: '💻', title: 'Web Design', description: 'Responsive websites and web apps.' },
          { icon: '📱', title: 'Mobile', description: 'Native and cross-platform mobile apps.' },
          { icon: '📸', title: 'Photography', description: 'Product and lifestyle photography.' },
        ],
      },
      {
        id: 'stats',
        type: 'stats',
        title: 'By the Numbers',
        items: [
          { value: '120+', label: 'Projects Completed' },
          { value: '45', label: 'Clients' },
          { value: '8', label: 'Awards' },
          { value: '5', label: 'Years' },
        ],
      },
      {
        id: 'cta',
        type: 'cta',
        title: 'Start Your Project',
        subtitle: 'Ready to bring your vision to life? Get in touch.',
        ctaText: 'Contact Us',
        ctaUrl: '/contact',
      },
    ],
  },
];

/**
 * Returns a starter template by slug.
 */
export function getStarterTemplate(slug: string): StarterTemplate | undefined {
  return STARTER_TEMPLATES.find((t) => t.slug === slug);
}

/**
 * Returns starter templates filtered by category.
 */
export function getStarterTemplatesByCategory(category: string): StarterTemplate[] {
  if (category === 'all') return STARTER_TEMPLATES;
  return STARTER_TEMPLATES.filter((t) => t.category === category);
}
