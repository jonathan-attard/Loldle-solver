const puppeteer = require('puppeteer');
var http = require ("http");
const cliProgress = require('cli-progress');
const colors = require('ansi-colors');

const baseUrl   = "https://loldle.net/"
const gameNames = ["classic", "quote", "ability", "splash"];

async function GetLatestVersion() {
  const options = {
    host: "ddragon.leagueoflegends.com",
    path: "/api/versions.json",
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  }

  return new Promise(function (resolve, reject) {
    const req = http.request(options, res => {

      var dstr = "";
      res.on('data', d => {
        dstr += d;
      });

      res.on("end", () => {
        var versions = JSON.parse (dstr);
        // data = jdval["data"];
        // versions = [];
        // for (var key in data) {
        //   versions.push(data[key]);
        // }
        resolve(versions[0]);
      });
    });

    req.on('error', error => {
      // console.log ("Error occurred");
      // console.error(error);
      reject(error);
    })

    req.end();
  });
}

async function GetChampions() {
  const version = await GetLatestVersion();

  const options = {
    host: "ddragon.leagueoflegends.com",
    path: `/cdn/${version}/data/en_US/champion.json`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  }

  return new Promise(function (resolve, reject) {
    const req = http.request(options, res => {

      var dstr = "";
      res.on('data', d => {
        dstr += d;
      });

      res.on("end", () => {
        var jdval = JSON.parse (dstr);
        data = jdval["data"];
        names = [];
        for (var key in data) {
          names.push(data[key]["name"]);
        }
        resolve(names);
      });
    });

    req.on('error', error => {
      // console.log ("Error occurred");
      // console.error(error);
      reject(error);
    })

    req.end();
  });
}

function shuffle(array) {
  // https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

async function BruteForceSolution(page, championNames, gameName, multibar) {
  url = baseUrl + gameName;

  await page.goto(url);

  // Looping through champions - Brute force
  const selector = "input";  // Input selector
  const winSelector = ".gg-name";
  var winningName = "";

  // create new progress bar
  const b1 = multibar.create(championNames.length, 0)

  await page.waitForSelector (selector);  // Waiting for input
  await page.$eval(selector, input => input.value = '');  // Clear input just in case
  for (const name of championNames) {
    b1.increment();
    try {
      await page.type(selector, name + String.fromCharCode(13), {delay: 0})
    } catch (error) {
      break;
    }
  }

  b1.stop();
  b1.updateETA();

  await page.waitForSelector (winSelector);  // Waiting for solution
  winningName = await page.$eval(winSelector, (el) => {
    return el.innerText;
  });

  return winningName;
}

async function GetSolutions() {
  const championNames = await GetChampions();

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null,
    args: [
      '--incognito',
      '--start-maximized',
    ],
  });

  const [page] = await browser.pages();
  page.close();
  const context = await browser.createIncognitoBrowserContext();

  // Progress bar
    const multibar = new cliProgress.MultiBar({
      // clearOnComplete: false,
      // hideCursor: true
  }, cliProgress.Presets.shades_grey);

  solutions = {};

  const promises = gameNames.map(async gameName => {
    // Shuffling champion names
    const staticChampionNamesClone = [...championNames];
    shuffle(staticChampionNamesClone);

    // Creating new page for each
    const newPage = await context.newPage();
    solutions[gameName] = await BruteForceSolution(newPage, staticChampionNamesClone, gameName, multibar);
  })

  await Promise.all(promises);

  multibar.stop();

  setTimeout(() => {
    browser.close();
  }, 100);

  return solutions;
}

async function LaunchSolutions(solutions) {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized'],
  });

  const [startingPage] = await browser.pages();
  startingPage.close()

  const selector = "input";  // Input selector
  const promises = gameNames.map(async gameName => {
    // Creating new page for each
    const page = await browser.newPage();

    // Getting solutions
    url = baseUrl + gameName;
    await page.goto(url);

    await page.type(selector, solutions[gameName] + String.fromCharCode(13), {delay: 0});
  })

  await Promise.all(promises);

  setTimeout(() => {
    browser.close();
  }, 100000);
}

async function main() {
  const solutions = await GetSolutions();
  console.log(solutions);
  LaunchSolutions(solutions);
}

main();
