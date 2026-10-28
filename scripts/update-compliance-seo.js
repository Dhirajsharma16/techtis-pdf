import fs from 'fs';

// 1. about.html
let about = fs.readFileSync('about.html', 'utf8');
about = about.replace('40 free, private', '60 free, private');
if (!about.includes('application/ld+json')) {
    const schema = `<script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "name": "About TECHTIS",
      "url": "https://techtis.in/about.html",
      "description": "About TECHTIS - 60 free, private, in-browser PDF, Image and Developer utilities."
    }
    </script>\n</head>`;
    about = about.replace('</head>', schema);
    fs.writeFileSync('about.html', about, 'utf8');
    console.log('Updated about.html');
}

// 2. privacy.html
let privacy = fs.readFileSync('privacy.html', 'utf8');
if (!privacy.includes('application/ld+json')) {
    const schema = `<script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Privacy Policy | TECHTIS",
      "url": "https://techtis.in/privacy.html",
      "description": "TECHTIS 100% Client-Side Privacy Policy. Zero document uploads, zero data retention."
    }
    </script>\n</head>`;
    privacy = privacy.replace('</head>', schema);
    fs.writeFileSync('privacy.html', privacy, 'utf8');
    console.log('Updated privacy.html');
}

// 3. terms.html
let terms = fs.readFileSync('terms.html', 'utf8');
if (!terms.includes('application/ld+json')) {
    const schema = `<script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Terms of Service | TECHTIS",
      "url": "https://techtis.in/terms.html",
      "description": "TECHTIS Terms of Service and Free Usage Guidelines."
    }
    </script>\n</head>`;
    terms = terms.replace('</head>', schema);
    fs.writeFileSync('terms.html', terms, 'utf8');
    console.log('Updated terms.html');
}

// 4. contact.html
let contact = fs.readFileSync('contact.html', 'utf8');
if (!contact.includes('application/ld+json')) {
    const schema = `<script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      "name": "Contact TECHTIS",
      "url": "https://techtis.in/contact.html",
      "description": "Contact TECHTIS support and developer team."
    }
    </script>\n</head>`;
    contact = contact.replace('</head>', schema);
    fs.writeFileSync('contact.html', contact, 'utf8');
    console.log('Updated contact.html');
}
