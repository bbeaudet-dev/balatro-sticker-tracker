# Development Guide

## Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/bbeaudet-dev/balatro-calculator.git
   cd balatro-calculator
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

This will start a live-server on port 3000 and automatically open your browser to `http://localhost:3000`.

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm start` - Same as dev (alias)
- `npm run build` - No build step required (static site)
- `npm test` - No tests configured yet

## Project Structure

```
balatro-calculator/
├── index.html          # Main HTML file
├── style.css           # Styles
├── main.js             # Main JavaScript logic
├── cards.js            # Joker data and definitions
├── hoverCard.js        # Tooltip functionality
├── assets/             # Images and sprites
│   ├── Jokers.png      # Joker sprite sheet
│   ├── chips.png       # Stake sticker sprites
│   └── ...             # Other assets
└── package.json        # Project configuration
```

## Development Features

- **Hot Reload**: Changes to HTML, CSS, or JS files will automatically refresh the browser
- **Live Server**: Serves files locally with proper MIME types
- **Port 3000**: Default development port (configurable)

## Contributing

1. Make your changes
2. Test with `npm run dev`
3. Commit your changes
4. Push to your fork
5. Create a pull request

## Notes

- This is a static site with no build process required
- All assets are served directly from the `assets/` directory
- The application uses localStorage for data persistence
- Stake sticker sprites are positioned using CSS background-position
