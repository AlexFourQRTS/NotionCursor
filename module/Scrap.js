const puppeteer = require('puppeteer');
const scrapData = require('./scrapData');


async function Scrap(link, from, to) {

  async function runInstans(start, end) {
    const browser = await puppeteer.launch({
      headless: false,
      ignoreHTTPSErrors: true,
      defaultViewport: { width: 1920, height: 1080 },
      // executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
      ],
    });
    console.log('browser is open');
    let page = await browser.newPage();
    await page.setViewport({ width: 1800, height: 1600 });
    await page.goto(link);
    try {
      await scrapData(page, start, end);
      await browser.close();
      return 'done';
    } catch (error) {
      console.log('Error ScrapLink', error);
    }
  }

  //  336 000 до этого 11 39 326

  // Run count instans
  console.log("from", from)
  console.log("to", to)
  let countInstans = 10 //how many brovser to open
  let differens = to - from  //90
  let step = differens / countInstans  //30

  // Make varible Number type
  differens = Number(differens)
  from = Number(from)
  step = Number(step)


  let i = 0;
  while (i < countInstans) {

    let start = from + (step * i)
    i = i + 1
    let end = from + (step * i)

    console.log("start :", start)
    console.log("end :", end)

    setTimeout(() => {
      runInstans(start, end)
    }, 2000);






  }




}

module.exports = Scrap;
