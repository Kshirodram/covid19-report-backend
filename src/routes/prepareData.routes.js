import path from "path";
import fs from "fs";
import { exec } from "child_process";

import _ from "lodash";

import countriesData from "../../data/countries.json";

import {formatDate} from "../utils";

const calculateDelta = (previousVal, currentVal) => {
  if (
    previousVal &&
    currentVal &&
    typeof previousVal === "number" &&
    typeof currentVal === "number"
  ) {
    return currentVal - previousVal;
  } else if (currentVal && typeof currentVal === "number") {
    return currentVal;
  } else {
    return 0;
  }
};

const addData = (previousVal, currentVal) => {
  if (
    previousVal &&
    currentVal &&
    typeof previousVal === "number" &&
    typeof currentVal === "number"
  ) {
    return currentVal + previousVal;
  } else if (currentVal && typeof currentVal === "number") {
    return currentVal;
  } else if (previousVal && typeof previousVal === "number") {
    return previousVal;
  } else {
    return 0;
  }
};

const getStateAndCountryCode = (country, state) => {
  let countryCode = "";
  let stateCode = "";
  countriesData.forEach((countryItem) => {
    if (countryItem.name === country) {
      countryCode = countryItem.value;
      if (countryItem.states && countryItem.states.length) {
        countryItem.states.forEach((stateItem) => {
          if (stateItem.name === state) {
            stateCode = stateItem.value;
          }
        });
      }
    }
  });
  return { countryCode, stateCode };
};

export default (app) => {
  // merge the us and global data
  app.get("/prepare/init", (req, res) => {
    const allData = {
      confirmed: [
        ...require("../../data/raw/covid19_confirmed_global.json"),
        ...require("../../data/raw/covid19_confirmed_US.json"),
      ],
      deaths: [
        ...require("../../data/raw/covid19_deaths_global.json"),
        ...require("../../data/raw/covid19_deaths_US.json"),
      ],
      recovered: require("../../data/raw/covid19_recovered_global.json"),
    };

    const KEY_MAP = {
      confirmed: "confirmedPerDay",
      deaths: "deathsPerDay",
      recovered: "recoveredPerDay",
    };

    const dateRegex =
      /^((0?[1-9]|1[012])[- /.](0?[1-9]|[12][0-9]|3[01])[- /.](19|20)?[0-9]{2})*$/;
    const objKeys = Object.keys(allData);

    const PRESERVED_KEYS = [
      "country",
      "state",
      "lat",
      "long",
      "countryCode",
      "stateCode",
    ];
    let mergedData = [];
    for (let i = 0; i < objKeys.length; i++) {
      const reportType = objKeys[i];
      const reportedData = allData[reportType];

      const groupedData = reportedData.map((parentObj) => {
        const stateAndCountryCodeObj = getStateAndCountryCode(
          parentObj.country,
          parentObj.state
        );
        const obj = {
          state: parentObj.state,
          country: parentObj.country,
          countryCode: stateAndCountryCodeObj.countryCode,
          stateCode: stateAndCountryCodeObj.stateCode,
          lat: parentObj.lat,
          long: parentObj.long,
        };

        // to skip the preserved keys otherwise map will
        // return undefined
        const objectKeys = Object.keys(parentObj).filter(
          (k) => PRESERVED_KEYS.indexOf(k) === -1
        );

        const data = objectKeys.map((key, i) => {
          if (dateRegex.test(key) && PRESERVED_KEYS.indexOf(key) === -1) {
            return {
              [reportType]: parentObj[key],
              date: formatDate(new Date(key)),
              [KEY_MAP[reportType]]: calculateDelta(
                parentObj[objectKeys[i - 1]],
                parentObj[key]
              ),
            };
          }
        });

        return { ...obj, data };
      });

      // combine sub regions data as US has
      // because we are ignoring those cases
      // data will be represented on state/country level only
      const combinedData = groupedData.reduce((acc, obj) => {
        const existing = acc.filter((v, i) => {
          return v.state === obj.state && v.country === obj.country;
        });
        if (existing.length) {
          Object.keys(obj.data).forEach((key) => {
            const lastObjInArr = acc[acc.length - 1];
            lastObjInArr.data[key][KEY_MAP[reportType]] = addData(
              lastObjInArr.data[key][KEY_MAP[reportType]],
              obj.data[key][KEY_MAP[reportType]]
            );
            lastObjInArr.data[key][reportType] = addData(
              lastObjInArr.data[key][reportType],
              obj.data[key][reportType]
            );
          });
        } else {
          acc.push(obj);
        }
        return acc;
      }, []);
      
      mergedData = _.merge([...mergedData], [...combinedData]);
    }

    const filePath = path.resolve(__dirname, "../../data/report.json");

    fs.writeFile(filePath, JSON.stringify(mergedData), "utf8", function (err) {
      if (err) {
        console.log("An error occured while writing JSON Object to File.");
        return console.log(err);
      } else {
        console.log("Updating db server..." + filePath);
        const command = `mongoimport --uri "mongodb+srv://admin:welcome%40123@cluster0-e6ksx.mongodb.net/covid19?authSource=admin&replicaSet=Cluster0-shard-0&readPreference=primary&appname=MongoDB%20Compass%20Community&ssl=true" --collection report --drop --file ${filePath} --jsonArray`;
        exec(command, (err, stdout, stderr) => {
          if (err) {
            console.error(`exec error: ${err}`);
            return;
          }
          console.log(`stdout: ${stdout}`);
          console.error(`stderr: ${stderr}`);
        });
      }
    });
    res.send({ message: `files created` });
  });
};
