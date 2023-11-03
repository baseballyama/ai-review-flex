import { describe, test, expect } from "vitest";
import { parse, chunk } from "./diff";

describe("source", () => {
  const source = `\
const PORT = 8080;
const HOME_PATH = '/home';
const ABOUT_PATH = '/about';
const SUBMIT_PATH = '/submit';

function isPortAvailable(port) {
  return port == PORT;
}

function listen(port, callback) {
  callback({ type: 'GET', path: HOME_PATH });
}

function routeToController(method, path, callback) {
  callback();
}

function renderTemplate(template, callback) {
  callback();
}

function fetchDataFromDB(key, callback) {
  callback({ name: 'John', age: 30 });
}

function validateData(data) {
  return data != null;
}

function saveToDB(data) {
  print("Data saved.");
}

function log(message) {
  print("Log: " + message);
}

function respondWithError(message) {
  print("Error: " + message);
}

function isNotEmpty(data) {
  return data != null;
}

function insertIntoTemplate(data) {
  print("Inserting data into template.");
}

function print(message) {
  // Simulate printing a message to the console
  return "Printed: " + message;
}

function onRequest(req) {
  routeToController(req.type, req.path, () => {
    if (req.path == HOME_PATH) {
      renderTemplate('home.html', () => {
        populateData(() => {
          fetchDataFromDB('home_data', (data) => {
            if (isNotEmpty(data)) {
              insertIntoTemplate(data);
            } else {
              log('No data to display');
            }
          });
        });
      });
    } else if (req.path == ABOUT_PATH) {
      renderTemplate('about.html', () => {});
    } else {
      renderTemplate('404.html', () => {});
    }
  });
}

function main() {
  if (isPortAvailable(PORT)) {
    listen(PORT, onRequest);
  } else {
    log(\`Port \${PORT} is not available\`);
  }
}

main();`;

  test("parse", async () => {
    expect(parse(source).length).toEqual(85);
  });

  test("chunk", async () => {
    const result = chunk({
      source,
      counter: (str: string) => str.length,
      maxCount: 200,
      duplicateLines: 2,
    });

    expect(result.length).toEqual(11);
    expect(result[0].startRow).toEqual(0);
    expect(result[0].endRow).toEqual(9);
    expect(result[1].startRow).toEqual(8);
    expect(result[1].endRow).toEqual(18);
    expect(result[10].startRow).toEqual(78);
    expect(result[10].endRow).toEqual(84);
  });
});
