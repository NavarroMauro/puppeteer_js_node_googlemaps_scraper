# Google Maps Scraper

This project is a Google Maps scraper using Puppeteer and Cheerio. It scrapes business information from Google Maps and saves the data to a JSON file.

## Prerequisites

- Node.js (version 14 or higher)
- pnpm

## Installation

1. Clone the repository:

    ```sh
    git clone https://github.com/yourusername/googlemaps_scraper_node.git
    cd googlemaps_scraper_node
    ```

2. Install the dependencies:

    ```sh
    pnpm install
    ```

## Usage

1. Open the `googlemaps.js` file and update the `query` variable with your desired search query:

    ```javascript
    const query = "Webentwicklung hamburg";
    ```

2. Run the script:

    ```sh
    pnpm start
    ```

3. The script will scrape the business information from Google Maps and save the data to a file named `businesses.json` in the project directory.

## Dependencies

- `cheerio`: A fast, flexible, and lean implementation of core jQuery designed specifically for the server.
- `puppeteer-core`: A library to control headless Chrome or Chromium over the DevTools Protocol.
- `puppeteer-extra`: A modular plugin framework for puppeteer.
- `puppeteer-extra-plugin-stealth`: A plugin to make puppeteer undetectable.
- `@sparticuz/chromium`: A Chromium binary for AWS Lambda and other environments.
