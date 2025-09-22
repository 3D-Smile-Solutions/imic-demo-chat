import React, { useState } from 'react';
import ChatWidget from './components/ChatWidget/ChatWidget';
// import ChatWidgetTest from './components/ChatWidget/ChatWidgetTest';

import shippingworldwide from './assets/24-shipping-worldwide.jpg'
import aftersalesbackground from './assets/after-sales-background.jpg'
import bg19201300 from './assets/bg-1920-1300.jpg'
import csmdentalacademylogo1e98c3c0d6e from './assets/csm_dental-academy-logo1_e98c3c0d6e.png'
import dentalakademieknowledge from './assets/dental-akademie-knowledge.webp'
import garantieen from './assets/garantie-en.png'
import Logo from './assets/Logo.svg'
import maschinenwartung1 from './assets/maschinenwartung-1.jpg'
import servicegewaehrleistungspakethintergrund1 from './assets/service-gewaehrleistungs-paket-hintergrund-1.jpg'
import toolsundaccessories1 from './assets/tools-und-accessories-1.png'
import tradeupen from './assets/trade-up-en.webp'
import technischersupporthintergrund2 from './assets/technischer-support-hintergrund-2.webp'
import dentalAcademyImage from './assets/csm_dental-akademie_a3695b2d2a.webp'
import maintenanceBenefits from './assets/maintenance-benefits.webp'



function App() {

    const [activeAccordions, setActiveAccordions] = useState({});
  const [formData, setFormData] = useState({
    department: '',
    title: '',
    firstName: '',
    lastName: '',
    company: '',
    address: '',
    zipCode: '',
    location: '',
    country: '',
    email: '',
    message: ''
  });

  const toggleAccordion = (sectionId, itemId) => {
    const key = `${sectionId}-${itemId}`;
    setActiveAccordions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Handle form submission here
  };

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleDropdown = (menu) => {
    setActiveDropdown(activeDropdown === menu ? null : menu);
  };

  // Main navigation items (top row)
  const mainNavItems = [
    { title: 'Dental', href: '#dental' },
    { title: 'Company', href: '#company' },
    { title: 'DSM', href: '#dsm' },
    { title: 'Marketplace', href: '#marketplace' },
    { title: 'Knowledge', href: '#knowledge' }
  ];

  // Sub navigation items (bottom row - for Dental section)
  const subNavItems = [
    { title: 'ALL', href: '#dental' },
    { title: 'CHAIRSIDE', href: '#dental/chairside' },
    { title: 'DENTAL LAB', href: '#dental/dental-lab' },
    { title: 'MILLING CENTER', href: '#dental/milling-center' },
    { title: 'TOOLS & MATERIALS', href: '#dental/tools-materials' }
  ];

  // Right side items
  const rightNavItems = [
    { title: 'DENTAL SUPPORT', href: '#dental/support' },
    { title: 'MY ACCOUNT', href: 'https://manager.dsm.imes-icore.com/', external: true }
  ];

  return (
     <>
      {/* Header */}
    <header className="header">
      <div className="header-container">
        {/* Top Navigation Bar */}
        <div className="header-top">
          <div className="header-top-inner">
            {mainNavItems.map((item, index) => (
              <a key={index} href={item.href} className="top-nav-item">
                {item.title}
              </a>
            ))}
          </div>
        </div>

        {/* Main Header Bar */}
        <div className="header-main">
          <div className="header-main-inner">
            {/* Logo */}
            <div className="logo">
              <a href="/">
                <img src={Logo} alt="imes-icore" />
              </a>
            </div>

            {/* Sub Navigation */}
            <nav className="sub-nav">
              {subNavItems.map((item, index) => (
                <a key={index} href={item.href} className="sub-nav-item">
                  {item.title}
                </a>
              ))}
            </nav>

            {/* Right Navigation */}
            <div className="right-nav">
              {rightNavItems.map((item, index) => (
                <a 
                  key={index}
                  href={item.href}
                  className="right-nav-item"
                  target={item.external ? '_blank' : '_self'}
                  rel={item.external ? 'noopener noreferrer' : undefined}
                >
                  {item.title}
                </a>
              ))}
              <button className="menu-toggle">☰</button>
            </div>
          </div>
        </div>
      </div>
    </header>

      {/* Hero Section */}
      <section className="section section-dark section-bg hero-section" style={{backgroundImage: `url(${aftersalesbackground})`}}>
        <div className="container">
          <div className="row">
            <div className="col-25"></div>
            <div className="col-75">
              <h2>
                <span className="subheader">Best in Class</span>
                <span className="heading-text">AFTER SALES SERVICE</span>
              </h2>
              <p>Building CAD/CAM machines is one thing, but the quality and reliability of after-sales service are just as important to us when it comes to customer satisfaction.</p>
              <p>To ensure availability of the machines and systems we deliver, imes-icore also provides full service. Throughout the entire life cycle of a CNC machine system, points of contact are created where we offer professional assistance.</p>
              
              <div className="accordion">
                <div className={`accordion-item ${activeAccordions['hero-0'] ? 'active' : ''}`}>
                  <div className="accordion-header" onClick={() => toggleAccordion('hero', 0)}>
                    <span>Read more</span>
                    <span className="accordion-icon">▼</span>
                  </div>
                  <div className="accordion-content">
                    <p><strong>WE UNDERSTAND SERVICE AS AN INTERPERSONAL MATTER!</strong></p>
                    <p><strong>Our service pledge</strong><br/>
                    Our customer-oriented service organisation provides continuous support for users and provides long-lasting solutions and ideas for the strategic development and success of our customers for the life of a machine.</p>
                    <ul>
                      <li>We deal with customers and take responsibility for the economical operation of our machines.</li>
                      <li>We pay a lot of attention to our customers and provide a special feeling of closeness for the purpose of developing long-term relationships.</li>
                      <li>Our innovations ensure permanent safety and top availability of machines.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Support Section */}
      <section className="section section-light section-bg" style={{backgroundImage: `url(${technischersupporthintergrund2})`}}>
        <div className="container">
          <div className="row">
            <div className="col-75">
              <h2>
                <span className="subheader">Service-Management-System</span>
                <span className="heading-text">TECHNICAL SUPPORT FOR CNC SYSTEMS AND CAD/CAM SOFTWARE</span>
              </h2>
              <p><strong>Service with a smile!</strong></p>
              <p>You will get the best service from us along the entire digital process chain. No matter whether you want to make the best possible use of your CAD/CAM applications or solve a technical problem with the CNC machine. From the first customer enquiry to successful solution, our highly qualified employees always strike the right tone.<br/>
              We assume responsibility for the strategic development of our customers for the entire life of a machine.</p>
              
              <div className="accordion">
                <div className={`accordion-item ${activeAccordions['tech-0'] ? 'active' : ''}`}>
                  <div className="accordion-header" onClick={() => toggleAccordion('tech', 0)}>
                    <span>Read more</span>
                    <span className="accordion-icon">▼</span>
                  </div>
                  <div className="accordion-content">
                    <p>The imes-icore ticket system is used to feed all incoming service requests into a structured workflow (from 1st to 2nd level support), creating an automatically transparent machine history. Our service management system provides top data security to ensure the best possible service quality at all times. This service quality reflects the culture of our company in our dealings with customers, employees, and business partners.</p>
                  </div>
                </div>
                <div className={`accordion-item ${activeAccordions['tech-1'] ? 'active' : ''}`}>
                  <div className="accordion-header" onClick={() => toggleAccordion('tech', 1)}>
                    <span>Team Viewer</span>
                    <span className="accordion-icon">▼</span>
                  </div>
                  <div className="accordion-content">
                    <p>Download <a href="https://get.teamviewer.com/en/imes_icore" target="_blank" rel="noopener noreferrer">Team Viewer</a></p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-25">
              <div className="contact-box">
                <div className="contact-item">
                  <span className="contact-icon">📞</span>
                  <a href="tel:+496672898469">+49 6672 898-469</a>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">📞</span>
                  <a href="tel:+496672898469">+49 6672 898-223</a>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">✉️</span>
                  <a href="mailto:support@imes-icore.de">support(at)imes-icore.de</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service/Warranty Packages Section */}
      <section className="section section-light section-bg warranty-section" style={{backgroundImage: `url(${servicegewaehrleistungspakethintergrund1})`}}>
        <div className="container">
          <div className="row">
            <div className="col-25"></div>
            <div className="col-75">
              <h2>
                <span className="subheader">Maximum safety – from the very first day!</span>
                <span className="heading-text">SERVICE/WARRANTY PACKAGES</span>
              </h2>
              <p><strong>Maximum safety – from the very first day!</strong><br/>
              We care about the best possible operation of your CAD/CAM system. Our warranty begins not on the date of delivery but on the date of installation for your safety. You will get an unlimited warranty of one year for the entire machine*, including the CNC controller.<br/>
              <strong>At the time of purchase, you will also have the option of getting an extended warranty from your authorised imes-icore distributor.</strong></p>
              
              <div className="warranty-image">
                <img src={garantieen} alt="Warranty Package"/>
              </div>
              
              <div className="accordion">
                <div className={`accordion-item ${activeAccordions['warranty-0'] ? 'active' : ''}`}>
                  <div className="accordion-header" onClick={() => toggleAccordion('warranty', 0)}>
                    <span>Read more</span>
                    <span className="accordion-icon">▼</span>
                  </div>
                  <div className="accordion-content">
                    <p><strong>Warranty and Service / Maintenance Packages</strong><br/>
                    Best service from the start!! Tap into our additional Economy and Premium packages to extend the warranty on your CNC machine or additionally use the combination with our maintenance contracts. Get financial planning security and keep a close eye on your ongoing operating costs over the years!<br/>
                    In addition, service contracts can be set up entirely according to your individual needs. Just ask your authorised imes-icore distributor!</p>
                    <p><small>*This excludes milling spindles with a warranty of one year or 2.000 operating hours, whichever comes first.<br/>
                    ** Within a release number.<br/>
                    *** Available for the 2nd, 3rd, or 4th year following delivery. Working hours and travel costs excluded.<br/>
                    **** Available for the 2nd, 3rd, or 4th year after delivery. Travel expenses excluded. Flat rate for working hours.</small></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Machine Maintenance Section */}
      <section className="section section-dark section-bg maintenance-section" style={{backgroundImage: `url(${maschinenwartung1})`}}>
        <div className="container">
          <div className="row">
            <div className="col-50"></div>
            <div className="col-50">
              <h2>
                <span className="subheader">The important thing is the reliability of your machine!</span>
                <span className="heading-text">Machine maintenance</span>
              </h2>
              <p><strong>Increase your productivity with your personal maintenance strategy!</strong><br/>
              No matter what restorations you do, one thing counts above all else in the end: the reliability of your machines. To that end, you need a maintenance strategy that is tailored exactly to your specific production conditions. This requires individual solutions and a high degree of flexibility, especially in combination with our additional packages for a warranty extension. Maximise your machine availability and reduce expensive downtimes for projectable maintenance/operating costs over the years!</p>
              
              <p><strong>Wear and tear begins with the first day of operation!</strong><br/>
              Our authorised service partner will get you optimal care and maintenance for the dental CAD/CAM system. Or you can contact imes-icore's after-sales service directly at any time in order to detect extraordinary wear and tear early on and to take appropriate measures.<br/>
              imes-icore will provide the complete service for your dental machine system that you need, including our offers for preserving the value of your machine. Thanks to the imes-icore maintenance package, the process safety, reliability, and value of your machine will be preserved.</p>
              
              <div className="accordion">
                <div className={`accordion-item ${activeAccordions['maintenance-0'] ? 'active' : ''}`}>
                  <div className="accordion-header" onClick={() => toggleAccordion('maintenance', 0)}>
                    <span>Read more</span>
                    <span className="accordion-icon">▼</span>
                  </div>
                  <div className="accordion-content">
                    <div className="image-wrapper">
                      <img src={maintenanceBenefits} alt="Maintenance Benefits" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Training Academy Section */}
      <section className="section section-dark">
      <div className="container">
        <div className="row">
          <div className="col-50">
            <div className="image-wrapper">
              <img src={dentalakademieknowledge} alt="Dental Academy Knowledge" />
            </div>
          </div>
          <div className="col-50">
            <h2>
              <span className="subheader">Customized dental training</span>
              <span className="heading-text">TRAINING ACADEMY</span>
            </h2>
            <p><strong>Knowledge has no limits!</strong></p>
            <p>We train hundreds of customers at our CAD/CAM dental academy every year according to this motto so that you can quickly reach a high level of productivity with our cutting-edge CAD/CAM systems. We will prepare you for manufacturing particularly challenging parts and familiarise you with new digital technology. From CAD through CAM, machine operation, and individual training to education and safe handling of complete process chains.</p>
            
            <div className="accordion">
              <div className={`accordion-item ${activeAccordions['training-0'] ? 'active' : ''}`}>
                <div className="accordion-header" onClick={() => toggleAccordion('training', 0)}>
                  <span>Read more</span>
                  <span className="accordion-icon">▼</span>
                </div>
                <div className="accordion-content">
                  <div className="accordion-content-inner">
                    <div className="accordion-image">
                      <img src={dentalAcademyImage} alt="Dental Academy" />
                    </div>
                    <div className="accordion-text">
                      <p><strong>The imes-icore Dental Academy</strong></p>
                      <p>It takes both specialist know-how and didactic competence to impart knowledge. imes-icore uses both aspects to develop training programmes for its customers so that anyone, whether beginner or expert, can acquire the knowledge tailored to his or her needs. We round off our programme with practical training approaches to practical cases of customers.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

      {/* Spare Parts Section */}
      <section className="section section-light">
        <div className="container">
          <div className="row">
            <div className="col-50">
              <h2>
                <span className="subheader">reliability lies in the details</span>
                <span className="heading-text">Spare parts and logistics</span>
              </h2>
              <p><strong>The imes-icore original. Quality that pays off!</strong><br/>
              The latest CAD/CAM technology and the performance that make imes-icore machines stand out are guaranteed thanks to our original spare parts. Each component involves a sophisticated development, manufacturing, and procurement process that is regulated by high and consistent quality standards. Optimised procedures and processes in the spare parts supply ensure a high availability. We work with globally recognised leading companies in order to always provide the latest solutions and guaranteed, safe, and high-quality products.</p>
              
              <div className="accordion">
                <div className={`accordion-item ${activeAccordions['spare-0'] ? 'active' : ''}`}>
                  <div className="accordion-header" onClick={() => toggleAccordion('spare', 0)}>
                    <span>Read more</span>
                    <span className="accordion-icon">▼</span>
                  </div>
                  <div className="accordion-content">
                    <h3><strong>Refurbished Spindles</strong></h3>
                    <p>Profit from our cost-effective spare milling spindles with manufacturer warranty!<br/>
                    High availability – High quality – Low investment!</p>
                    <h3><strong>The Efficient Spare Parts Centre...</strong></h3>
                    <p><strong>...with 2.000 m² and ~10.000 items</strong><br/>
                    Global shipping of any selected spare part within 24 hours: All spare parts that you need, paired with the security you get from a rapid and efficient service.</p>
                  </div>
                </div>
                <div className={`accordion-item ${activeAccordions['spare-1'] ? 'active' : ''}`}>
                  <div className="accordion-header" onClick={() => toggleAccordion('spare', 1)}>
                    <span>RMA return and settlement provisions</span>
                    <span className="accordion-icon">▼</span>
                  </div>
                  <div className="accordion-content">
                    <p><a href="#" className="button">Download RMA provisions (PDF, 69 KB)</a></p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-50">
              <div className="image-wrapper">
                <img src={shippingworldwide} alt="24/7 Shipping Worldwide" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Validated Overall Process Section */}
      <section className="section section-gray section-bg tools-section">
        <div className="container">
          <div className="row">
            <div className="col-50">
              <div className="image-wrapper">
                <img src={toolsundaccessories1} alt="Tools and Accessories" />
              </div>
            </div>
            <div className="col-50">
              <h2>
                <span className="subheader">Tools and Accessories</span>
                <span className="heading-text">Validated Overall Process</span>
              </h2>
              <p><strong>Our Know-How for Top Productivity!</strong><br/>
              An efficient and high-precision CNC machine is the basic prerequisite for the automated dental production process. However, optimised and machine-tailored CAD/CAM milling strategies, high-end milling tools, suitable materials, and universal holders and applications only make a difference in daily operations.</p>
              <p>We guarantee that we will provide you with validated processes with which you can meet the highest regulatory requirements of our time. In addition, our CAD/CAM expert team will provide you with assistance and advice in after-sales at any time.</p>
              
              <div className="accordion">
                <div className={`accordion-item ${activeAccordions['tools-0'] ? 'active' : ''}`}>
                  <div className="accordion-header" onClick={() => toggleAccordion('tools', 0)}>
                    <span>Read more</span>
                    <span className="accordion-icon">▼</span>
                  </div>
                  <div className="accordion-content">
                    <p><strong>CAD/CAM software</strong><br/>
                    Up-to-date at all times! The easy use of our dental milling machines is paramount to the development of our CAD/CAM systems. Whether 5-axle simultaneous machining, automatic detection of required parameters or permanent integration of the latest milling strategies will give you all the options you need for economic production.</p>
                    <p><strong>CAD/CAM blanks</strong><br/>
                    For each type of dental milling machine, we offer specially developed and tested materials such as our own CORiTEC materials in order to ensure the highest level of quantity and quality for you with your system.</p>
                    <p><strong>Milling and Grinding Tools</strong><br/>
                    For all dental CORiTEC milling machines and for each material, we offer specially developed and tested milling and grinding tools with 3 mm and 6 mm shafts.</p>
                    <p><strong>Holders and Applications</strong><br/>
                    No Limits with Plug & Play!<br/>
                    A variety of tool holders from international dental specialists will enhance your high-end CAD/CAM system in a flexible and quick manner for boundless production possibilities!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trade-Up/Trade-In Section */}
      <section className="section section-light">
        <div className="container">
          <h2>
            <span className="subheader">ALWAYS STAY UP TO DATE!</span>
            <span className="heading-text">TRADE-UP/ TRADE-IN</span>
          </h2>
          <div className="row">
            <div className="col-33">
              <p><strong>Trade-Up</strong><br/>
              With trade-up, we offer a special payment programme for our customers, e.g., for machines that can no longer be updated to the latest state of technology.</p>
              <p><strong>Trade-In</strong><br/>
              Through trade-in, we accept competitor machines as payment against a new imes-icore machine.</p>
            </div>
            <div className="col-33">
              <p><strong>First Choice Second-Hand!</strong><br/>
              The imes-icore milling machines are known for their durability and sturdiness. They operate faithfully and reliably over the years like on the very first day. But the dental market is a dynamic industry. New lines of business emerge and old ones disappear, order amounts rise and fall. It is precisely for these reasons that used machines, e.g., upon one's entry into a new line of business or as a backup machine for covering material peaks, are a considerable alternative to new machines.</p>
            </div>
            <div className="col-33">
              <p><strong>Certified Used Machines with Warranty</strong><br/>
              We have used equipment as well as imes-icore certified used machines that are maintained and prepared according to a higher standard.</p>
              <p><strong>Benefits:</strong></p>
              <ul>
                <li>Inspection, preparation, and quality control according to imes-icore standards</li>
                <li>Every machine is less than 4 years old</li>
                <li>For basic machines: 6 or 12-month manufacturer warranty</li>
              </ul>
            </div>
          </div>
          <div className="image-wrapper">
            <img src={tradeupen} alt="Trade Up Program" />
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="section section-dark section-bg contact-section" style={{backgroundImage: `url(${bg19201300})`}}>
        <div className="container">
          <h2>
            <span className="subheader">What can we do for you?</span>
            <span className="heading-text">Contact us</span>
          </h2>
          <p style={{textAlign: 'center', marginBottom: '40px'}}>Choose your country for contact to the imes-icore international sales & service team.<br/>
          We take care that your message will reach the correct international contact for your concerns.</p>
          
          <div className="contact-form">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Departments <span className="mandatory">*</span></label>
                <select 
                  className="form-select" 
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Please select...</option>
                  <option value="sales-dental">Sales dental systems</option>
                  <option value="support">Support</option>
                  <option value="purchasing">Purchasing</option>
                  <option value="marketing">Marketing</option>
                  <option value="reception">Reception</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Title <span className="mandatory">*</span></label>
                <select 
                  className="form-select"
                  name="title" 
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Please select...</option>
                  <option value="Mr">Mr.</option>
                  <option value="Mrs">Ms.</option>
                  <option value="Mx">Divers</option>
                </select>
              </div>
              
              <div className="row">
                <div className="col-50">
                  <div className="form-group">
                    <label className="form-label">First name <span className="mandatory">*</span></label>
                    <input 
                      type="text" 
                      className="form-input"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange} 
                      required
                    />
                  </div>
                </div>
                <div className="col-50">
                  <div className="form-group">
                    <label className="form-label">Last name <span className="mandatory">*</span></label>
                    <input 
                      type="text" 
                      className="form-input"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange} 
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Company</label>
                <input 
                  type="text" 
                  className="form-input"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Address</label>
                <input 
                  type="text" 
                  className="form-input"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="row">
                <div className="col-50">
                  <div className="form-group">
                    <label className="form-label">Zip code</label>
                    <input 
                      type="text" 
                      className="form-input"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="col-50">
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input 
                      type="text" 
                      className="form-input"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Country <span className="mandatory">*</span></label>
                <select 
                  className="form-select"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange} 
                  required
                >
                  <option value="">Please select...</option>
                  <option value="Germany">Germany</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="France">France</option>
                  <option value="Italy">Italy</option>
                  <option value="Spain">Spain</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">E-mail <span className="mandatory">*</span></label>
                <input 
                  type="email" 
                  className="form-input"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange} 
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Your message</label>
                <textarea 
                  className="form-textarea"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                ></textarea>
              </div>
              
              <button 
                type="submit" 
                className="button"
              >
                Contact us →
              </button>
            </form>
          </div>
          
          <p style={{textAlign: 'center', marginTop: '20px', color: '#999', fontSize: '14px'}}>*Required field</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col">
              <h4>imes-icore GmbH</h4>
              <p>Im Leibolzgraben 16<br/>
              36132 Eiterfeld<br/>
              Hessen, Germany</p>
              <p>+49 6672 898-228<br/>
              info(at)imes-icore.com</p>
            </div>
            
            <div className="footer-col">
              <h4>Our Machines</h4>
              <ul className="footer-links">
                <li><a href="#">Chairside</a></li>
                <li><a href="#">Dental Lab</a></li>
                <li><a href="#">Milling center</a></li>
              </ul>
            </div>
            
            <div className="footer-col">
              <h4>Our Company</h4>
              <ul className="footer-links">
                <li><a href="#">Company</a></li>
                <li><a href="#">News</a></li>
                <li><a href="#">Fairs</a></li>
                <li><a href="#">Career</a></li>
                <li><a href="#">Contact</a></li>
              </ul>
            </div>
            
            <div className="footer-col">
              <h4>Our Services</h4>
              <ul className="footer-links">
                <li><a href="#">Dental Support</a></li>
                <li><a href="#">Competence & Service Center USA</a></li>
                <li><a href="#">Competence & Service Center Asia</a></li>
              </ul>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>© Copyright 2025 imes-icore GmbH | Imprint | Terms & Conditions | Privacy policy | Newsletter</p>
          </div>
        </div>
      </footer>
      <ChatWidget />
    </>
  );
}

export default App;