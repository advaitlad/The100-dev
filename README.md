# The100
A fun guessing game based on numbers and rankings.

Play the game at: https://advaitlad.github.io/The100-pages

# The100-dev

A development version of The100 game, where players try to guess the 100th ranked item in various categories.

## Features
- Multiple categories to choose from
- User authentication
- Score tracking
- Progress saving
- Responsive design

## Setup
1. Clone the repository
2. Replace the Firebase configuration in `index.html` with your own Firebase project credentials
3. Open `index.html` in a web browser to play

## Development
This is the development version of The100, used for testing new features and improvements.

### Project Structure
```
The100-dev/
├── assets/          # Images, icons, and other static assets
├── js/             # JavaScript files
│   ├── auth.js     # Authentication logic
│   ├── categories-data.js  # Categories and their data
│   ├── firebase-service.js # Firebase service functions
│   └── script.js   # Main game logic
├── index.html      # Main HTML file
└── styles.css      # CSS styles
```

### Firebase Setup
1. Create a new Firebase project
2. Enable Authentication (Email/Password)
3. Set up Firestore Database
4. Configure Security Rules
5. Add your Firebase configuration to `index.html`

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License
This project is licensed under the MIT License - see the LICENSE file for details.
