# Patent Management System - React Version

A modern React.js application for managing intellectual property, specifically design patents. This system allows users to create, edit, delete, and manage patent applications with detailed file uploads and author information.

## Features

### 🏠 Home Page
- Clean, modern interface with service cards
- Navigation to different patent types
- Responsive design with smooth animations

### 📋 Design Patent Management
- Create new design patents
- Edit existing patents
- Delete patents with confirmation
- View patent details
- Status tracking (Under Booking, Booking, Under File, Filed, FER, SER, Grant, Cancel)

### 📄 Patent Details
- File upload system for multiple document types:
  - Form 1
  - Form 21
  - Representation Sheet
  - Form 21 Stamp
  - Additional documents (Document 1, 2, 3)
- Multiple position management
- Author details for each position
- Amount and pending amount tracking

### 👥 Author Management
- Comprehensive author information form
- Validation for email and mobile number
- Department, designation, and college information
- Reusable across multiple positions

### 💾 Data Persistence
- Local storage for offline functionality
- Automatic data saving
- Data recovery and restoration

## Technology Stack

- **Frontend**: React.js 18
- **Routing**: React Router DOM
- **Styling**: CSS3 with modern animations
- **Icons**: Font Awesome 6
- **Storage**: Browser Local Storage

## Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd patent-management-react
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Open your browser and navigate to:**
   ```
   http://localhost:3000
   ```

## Project Structure

```
src/
├── components/
│   ├── Home.jsx             # Home page with service cards
│   ├── Navbar.jsx           # Navigation component
│   ├── DesignPatent.jsx     # Patent listing and management
│   ├── PatentDetails.jsx    # Detailed patent information
│   ├── PatentModal.jsx      # Modal for creating/editing patents
│   └── AuthorModal.jsx      # Modal for author information
├── utils/
│   └── helpers.jsx          # Utility functions
├── App.jsx                  # Main application component
├── App.css                  # Global styles
└── index.js                 # Application entry point

public/
├── images/
│   ├── kplogo.png          # Favicon
│   └── Kraitlogonew.png    # Main logo
└── index.html              # HTML template
```

## Usage

### Creating a New Patent
1. Navigate to Design Patents page
2. Click "Add New Patent" button
3. Fill in patent title and select status
4. Click "Save" to create the patent

### Managing Patent Details
1. Click on any patent title to view details
2. Upload required documents using the file upload cards
3. Add positions with author information
4. Set amounts and pending amounts
5. Save all changes

### Adding Authors
1. In patent details, click "Select Author" for any position
2. Fill in all required author information
3. Validate email format and 10-digit mobile number
4. Save author details

## Features in Detail

### File Upload System
- Supports multiple file formats (PDF, DOC, DOCX, JPG, PNG)
- Multiple file upload per category
- File preview functionality
- File deletion with confirmation

### Position Management
- Dynamic position addition/removal
- Position number validation (no duplicates)
- Author assignment per position
- Amount tracking

### Data Validation
- Email format validation
- Mobile number validation (10 digits)
- Required field validation
- Position number uniqueness

### Responsive Design
- Mobile-friendly interface
- Tablet and desktop optimized
- Touch-friendly buttons and interactions

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Local Storage Structure

The application uses browser local storage with the following keys:
- `patents`: Array of all patents
- `patentCounter`: Counter for generating unique patent IDs
- `patent_{id}_details`: Detailed information for each patent
- `patent_{id}_authors`: Author information for each patent

## Development

### Available Scripts

- `npm start`: Runs the app in development mode
- `npm run build`: Builds the app for production
- `npm test`: Launches the test runner
- `npm run eject`: Ejects from Create React App (irreversible)

### Adding New Features

1. Create new components in the `src/components/` directory
2. Add routing in `App.js` if needed
3. Update styles in `App.css`
4. Test thoroughly across different screen sizes

## Deployment

To deploy the application:

1. **Build the production version:**
   ```bash
   npm run build
   ```

2. **Deploy the `build` folder to your web server**

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please contact the development team.

---

**Note**: This is a client-side application that stores data locally. For production use, consider implementing a backend database for data persistence and user management.