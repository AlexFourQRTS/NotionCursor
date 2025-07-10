const saveToExcel = require('./exelCreate');

async function scrapData(page, from, to) {
  await page.waitForSelector('#MainContent_LicNo');

  for (let i = from; i <= to; i++) {
    try {
      const input = await page.$('#MainContent_LicNo');
      if (input) {
        await input.click({ clickCount: 3 });
        await page.keyboard.press('Backspace');

        await input.type(i.toString(), { delay: 100 });
        await page.click('#MainContent_Contractor_License_Number_Search');
        await page.waitForNavigation({ waitUntil: 'networkidle0' })

        const businessInfoElement = await page.$('#MainContent_BusInfo');
        const classificationElement = await page.$('#MainContent_ClassCellTable a');

        let business_info = null;
        if (businessInfoElement) {
          business_info = await page.evaluate(el => el.innerText, businessInfoElement);
        }

        let classification = null;
        if (classificationElement) {
          classification = await page.$eval('#MainContent_ClassCellTable a', el => el.innerText);
        }

        if (business_info && classification) {
          await page.click('#MainContent_PersonnelLink');
          await page.waitForNavigation({ waitUntil: 'networkidle0' })

          let name = await page.$eval('#MainContent_dlAssociated_hlName_0', el => el.innerText).catch(() => null);

          if (!name) {
            name = await page.$eval('#MainContent_dlNoAssociation_hlName_0', el => el.innerText).catch(() => null);
          }


          if (name) {
            await saveToExcel({ license: i, business_info, classification, name });
          } else {
            await saveToExcel({ license: i, business_info, classification, name: '' });
          }

          await Promise.all([
            page.goBack(),
            page.waitForNavigation({ waitUntil: 'networkidle2' })
          ]);
        }
        await Promise.all([
          page.goBack(),
          page.waitForNavigation({ waitUntil: 'networkidle2' })
        ]);
      }
    } catch (error) {
      console.log(`Error processing ${i}: ${error.message}`);
    }
  }
}



module.exports = scrapData;


