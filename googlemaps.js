import * as cheerio from "cheerio";
import puppeteerExtra from "puppeteer-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
import chromium from "@sparticuz/chromium";
import fs from "fs";

// ...existing code...

async function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

async function searchGoogleMaps() {
    try {
      const start = Date.now();
  
      puppeteerExtra.use(stealthPlugin());
  
      const browser = await puppeteerExtra.launch({
        headless: false,
        // headless: "new",
        // devtools: true,
        executablePath: "/usr/bin/google-chrome", // your path here
      });
  
      // const browser = await puppeteerExtra.launch({
      //   args: chromium.args,
      //   defaultViewport: chromium.defaultViewport,
      //   executablePath: await chromium.executablePath(),
      //   headless: "new",
      //   ignoreHTTPSErrors: true,
      // });
  
      const page = await browser.newPage();
  
      const query = "Webentwicklung hamburg";
  
      async function navigateWithRetry(url, retries = 3) {
        for (let i = 0; i < retries; i++) {
          try {
            await page.goto(url, { waitUntil: 'networkidle2' });
            return;
          } catch (error) {
            console.log(`Error navigating to ${url}, retrying... (${i + 1}/${retries})`);
            if (i === retries - 1) throw error;
          }
        }
      }
  
      try {
        await navigateWithRetry(`https://www.google.com/maps/search/${query.split(" ").join("+")}`);
      } catch (error) {
        console.log("error going to page");
      }
  
      async function autoScroll(page, retries = 6) {
        for (let i = 0; i < retries; i++) {
          try {
            await page.evaluate(async () => {
              const wrapper = document.querySelector('div[role="feed"]');
  
              await new Promise((resolve, reject) => {
                var totalHeight = 0;
                var distance = 1000;
                var scrollDelay = 3000;
  
                var timer = setInterval(async () => {
                  var scrollHeightBefore = wrapper.scrollHeight;
                  wrapper.scrollBy(0, distance);
                  totalHeight += distance;
  
                  if (totalHeight >= scrollHeightBefore) {
                    totalHeight = 0;
                    await new Promise((resolve) => setTimeout(resolve, scrollDelay));
  
                    // Calculate scrollHeight after waiting
                    var scrollHeightAfter = wrapper.scrollHeight;
  
                    if (scrollHeightAfter > scrollHeightBefore) {
                      // More content loaded, keep scrolling
                      return;
                    } else {
                      // No more content loaded, stop scrolling
                      clearInterval(timer);
                      resolve();
                    }
                  }
                }, 200);
              });
            });
            return;
          } catch (error) {
            console.log(`Error during autoScroll, retrying... (${i + 1}/${retries})`);
            console.error(error);

            // Check if the page is still in the expected state
            const currentUrl = page.url();
            if (!currentUrl.includes("google.com/maps/search")) {
              console.log("Page navigated away, stopping autoScroll");
              throw error;
            }

            await delay(5000); // Increase delay between retries
            if (i === retries - 1) throw error;
          }
        }
      }
  
      await autoScroll(page);
  
      // Add a delay to ensure the page content is fully loaded
      await delay(5000);
  
      const html = await page.content();
      const pages = await browser.pages();
      await Promise.all(pages.map((page) => page.close()));
  
      await browser.close();
      console.log("browser closed");
  
      // get all a tag parent where a tag href includes /maps/place/
      const $ = cheerio.load(html);
      const aTags = $("a");
      const parents = [];
      aTags.each((i, el) => {
        const href = $(el).attr("href");
        if (!href) {
          return;
        }
        if (href.includes("/maps/place/")) {
          parents.push($(el).parent());
        }
      });
  
      console.log("parents", parents.length);
  
      const buisnesses = [];
  
      parents.forEach((parent) => {
        const url = parent.find("a").attr("href");
        // get a tag where data-value="Website"
        const website = parent.find('a[data-value="Website"]').attr("href");
        // find a div that includes the class fontHeadlineSmall
        const storeName = parent.find("div.fontHeadlineSmall").text();
        // find span that includes class fontBodyMedium
        const ratingText = parent
          .find("span.fontBodyMedium > span")
          .attr("aria-label");
  
        // get the first div that includes the class fontBodyMedium
        const bodyDiv = parent.find("div.fontBodyMedium").first();
        const children = bodyDiv.children();
        const lastChild = children.last();
        const firstOfLast = lastChild.children().first();
        const lastOfLast = lastChild.children().last();
  
        buisnesses.push({
          placeId: `ChI${url?.split("?")?.[0]?.split("ChI")?.[1]}`,
          address: firstOfLast?.text()?.split("·")?.[1]?.trim(),
          category: firstOfLast?.text()?.split("·")?.[0]?.trim(),
          phone: lastOfLast?.text()?.split("·")?.[1]?.trim(),
          googleUrl: url,
          bizWebsite: website,
          storeName,
          ratingText,
          stars: ratingText?.split("stars")?.[0]?.trim()
            ? Number(ratingText?.split("stars")?.[0]?.trim())
            : null,
          numberOfReviews: ratingText
            ?.split("stars")?.[1]
            ?.replace("Reviews", "")
            ?.trim()
            ? Number(
                ratingText?.split("stars")?.[1]?.replace("Reviews", "")?.trim()
              )
            : null,
        });
      });
      const end = Date.now();
  
      console.log(`time in seconds ${Math.floor((end - start) / 1000)}`);
  
      // Save the generated JSON to a file
      fs.writeFileSync("businesses.json", JSON.stringify(buisnesses, null, 2));

      return buisnesses;
    } catch (error) {
      console.log("error at googleMaps", error.message);
    }
  }
  
  searchGoogleMaps().then((businesses) => {
    console.log("Scraped businesses:", businesses);
  }).catch((error) => {
    console.error("Error scraping Google Maps:", error);
  });