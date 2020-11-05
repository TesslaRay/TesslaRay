const puppeteer = require("puppeteer");
const fs = require('fs');
const Mustache = require('mustache');

const MUSTACHE_MAIN_DIR = './main.mustache';

let DATA = {
  refresh_date: new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZoneName: 'short',
    timeZone: 'America/Santiago',
  }),
};

console.log(DATA);


/**
 * Scrapping from webpage from CEN
 */
async function scracpCEN() {
  try {
    let browser = await puppeteer.launch({ 
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-infobars',
        '--window-position=0,0',
        '--ignore-certifcate-errors',
        '--ignore-certifcate-errors-spki-list',
        '--incognito',
      ],
      headless: true,
    });

    let page = await browser.newPage();

    await page.goto(`https://www.coordinador.cl/operacion/graficos/operacion-real/generacion-real-del-sistema/`);
    await page.click('div[id="Heading3"]');

    await page.waitForSelector("g.amcharts-pie-item");

    let dataEnergy = await page.evaluate(() => {
      let genTypeList = document.querySelectorAll(`g.amcharts-pie-item`);

      let dataEnergySelector = [];

      for (let i = 0; i < genTypeList.length; i++) {
        dataEnergySelector[i] = {
          Type: genTypeList[i].getAttribute("aria-label"),
        }
      }

      return dataEnergySelector;
    });
    
    let dataEnergyArray = [];
    for (let i = 0; i < dataEnergy.length; i++) {
      let data = dataEnergy[i].Type.split(' ');
      dataEnergyArray[i] = {
        type: data[0],
        percent: data[1],
        gen: data[2],
      }
    }

    dataEnergyArrayType = dataEnergyArray.map(id => id.type);

    let genChile = 0;
    for ( let i = 0; i < dataEnergyArray.length; i ++){
      dataEnergyArray[i].gen = dataEnergyArray[i].gen.replace(',','');
      genChile = genChile + parseInt(dataEnergyArray[i].gen);
    }
    DATA.genChile = (genChile/1000).toFixed(1);

    DATA.term = dataEnergyArray[dataEnergyArrayType.indexOf('TERMICA:')].percent;
    DATA.eolic = dataEnergyArray[dataEnergyArrayType.indexOf('EOLICA:')].percent;
    DATA.hidro = dataEnergyArray[dataEnergyArrayType.indexOf('HIDRAULICA:')].percent;
    DATA.solar = dataEnergyArray[dataEnergyArrayType.indexOf('SOLAR:')].percent;

    console.log(DATA);
    await browser.close();
    console.log("Browser closed");
  } catch (err) {
    console.log(err);
    console.log("Browser closed for error");
    process.exit();
  }
};


async function generateReadMe() {
  await fs.readFile(MUSTACHE_MAIN_DIR, (err, data) => {
    if (err) throw err;
    const output = Mustache.render(data.toString(), DATA);
    fs.writeFileSync('README.md', output);
  });
}

async function action() {
   /**
   * Scrap CEN web page
   */
  await scracpCEN();

  /**
   * Generate README
   */
  await generateReadMe();

}

action();