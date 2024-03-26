"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsdom_1 = require("jsdom");
const node_fetch_1 = __importDefault(require("node-fetch"));
const fast_average_color_node_1 = require("fast-average-color-node");
const voice_1 = require("@discordjs/voice");
const stream_1 = require("stream");
const databasehandler_1 = __importDefault(require("./databasehandler"));
const europeanURL = "https://radiomap.eu";
const worldURL = "https://worldradiomap.com";
const virtualConsole = new jsdom_1.VirtualConsole();
virtualConsole.on('error', () => { });
async function getFlagColorAverage(isoCode) {
    try {
        const prepIsoCode = isoCode.split("/")[0].toLowerCase();
        const url = `https://worldradiomap.com/2013/flags/46/${prepIsoCode}.png`;
        const avgColor = await (0, fast_average_color_node_1.getAverageColor)(url);
        return avgColor.hex;
    }
    catch (err) {
        return undefined;
    }
}
let countryIds = [];
async function fetchData(countryName, isoCode, isEuropean, skipExisting, progressCallback) {
    let countryId = 1;
    try {
        const regions = (isEuropean ? await fetchEuropeanRegions(countryName, isoCode) : await fetchWorldRegions(countryName, isoCode));
        if (!regions)
            return undefined;
        let databaseData = [];
        const result = [];
        const allDocs = await databasehandler_1.default.StationsData.find({}).select("-_id -__v").exec();
        const currentCountry = allDocs.find((element) => element.country === countryName && element.country_id);
        if (!currentCountry) {
            const savedCountriesIds = allDocs.map((element) => element.country_id);
            for (let i = 0; i <= countryIds.length + savedCountriesIds.length; i++) {
                if (!countryIds.includes(i + 1) && !savedCountriesIds.includes(i + 1)) {
                    countryId = i + 1;
                    break;
                }
            }
            countryIds.push(countryId);
        }
        else {
            countryId = currentCountry.country_id;
        }
        const doc = allDocs.filter((element) => element.country === countryName)[0];
        if (doc && doc.regions) {
            doc.regions.forEach((element) => {
                const stations = element.stations;
                databaseData.push({ region_name: element.region_name, region_id: element.region_id, region_image: element.region_image, stations: stations });
            });
        }
        const flagColorAverage = await getFlagColorAverage(isoCode);
        if (regions.length <= 0) {
            const splitIsoCode = isoCode.split("/");
            const prepIsoCode = splitIsoCode[0];
            const regionName = splitIsoCode[1];
            if (skipExisting && databaseData.find((element) => element.region_name === regionName)) {
                await progressCallback(countryId, 100, 0, regionName, undefined, flagColorAverage);
                countryIds.splice(countryIds.lastIndexOf(countryId), 1);
                return databaseData;
            }
            if (splitIsoCode.length <= 1) {
                countryIds.splice(countryIds.lastIndexOf(countryId), 1);
                return undefined;
            }
            await progressCallback(countryId, 0, NaN, regionName, undefined, flagColorAverage);
            const stationsArray = await fetchStationsOfRegion(prepIsoCode, regionName, isEuropean);
            if (!stationsArray || stationsArray.length === 0) {
                countryIds.splice(countryIds.lastIndexOf(countryId), 1);
                return undefined;
            }
            result.push({ region_name: regionName, region_id: 1, stations: stationsArray });
            await progressCallback(countryId, 100, 0, undefined, undefined, flagColorAverage);
            countryIds.splice(countryIds.lastIndexOf(countryId), 1);
            return result;
        }
        //const defaultEstimatedTime = ((skipExisting ? regions.length - result.length : regions.length) * 55 * 4.5);
        await progressCallback(countryId, 0, NaN, regions[0].name.replaceAll(":", ", "), undefined, flagColorAverage);
        let totalTime = 0;
        let skipped = 0;
        for (let i = 0; i < regions.length; i++) {
            if (skipExisting && databaseData.find((element) => element.region_name === regions[i].name)) {
                skipped++;
                const percentage = (((i + 1) / (regions.length + 1)) * 100).toFixed(2);
                const estimatedTime = ((totalTime / ((i + 1) - skipped)) * (regions.length - (i + 1 - skipped)));
                const nextRegion = (i + 1 > regions.length - 1 ? regions.length - 1 : i + 1);
                result.push({ region_name: databaseData[i].region_name, region_id: databaseData[i].region_id, stations: databaseData[i].stations });
                await progressCallback(countryId, Number(percentage), Number(estimatedTime), regions[nextRegion].name, result, flagColorAverage);
                continue;
            }
            let start = Date.now();
            const stationsArray = await fetchStationsOfRegion(isoCode, regions[i].url, isEuropean);
            let end = Date.now();
            if (!stationsArray || stationsArray.length === 0) {
                skipped++;
                const percentage = (((i + 1) / (regions.length + 1)) * 100).toFixed(2);
                const estimatedTime = ((totalTime / ((i + 1) - skipped)) * (regions.length - (i + 1 - skipped)));
                const nextRegion = (i + 1 > regions.length - 1 ? regions.length - 1 : i + 1);
                await progressCallback(countryId, Number(percentage), Number(estimatedTime), regions[nextRegion].name.replaceAll(":", ", "), result, flagColorAverage);
                continue;
            }
            result.push({ region_name: regions[i].name, region_id: i + 1, stations: stationsArray });
            totalTime += (end - start) / 1000;
            const percentage = (((i + 1) / (regions.length + 1)) * 100).toFixed(2);
            const estimatedTime = ((totalTime / ((i + 1) - skipped)) * (regions.length - (i + 1 - skipped)));
            const nextRegion = (i + 1 > regions.length - 1 ? regions.length - 1 : i + 1);
            await progressCallback(countryId, Number(percentage), Number(estimatedTime), regions[nextRegion].name.replaceAll(":", ", "), result, flagColorAverage);
        }
        countryIds.splice(countryIds.lastIndexOf(countryId), 1);
        return result;
    }
    catch {
        countryIds.splice(countryIds.lastIndexOf(countryId), 1);
        return undefined;
    }
}
async function fetchEuropeanRegions(countryName, isoCode) {
    try {
        const data = await (0, node_fetch_1.default)(europeanURL + "/" + isoCode.toLowerCase(), { timeout: 5000 });
        const dataText = await data.text();
        const dom = new jsdom_1.JSDOM(dataText, { virtualConsole });
        const elements = dom.window.document.querySelectorAll(".title > a");
        const stationLocations = [];
        for (let i = 0; i < elements.length; i++) {
            const item = elements.item(i);
            const href = item.href;
            let regionURL = href;
            if (regionURL.startsWith("https") || regionURL.startsWith("www"))
                continue;
            if (regionURL.startsWith("../") || regionURL.startsWith("/" + isoCode)) {
                const splitRegionURL = regionURL.split("/");
                if (splitRegionURL[1] !== isoCode)
                    continue;
                regionURL = splitRegionURL[2];
            }
            const name = regionURL.split(".")[0];
            stationLocations.push({ name: name, url: regionURL });
        }
        return stationLocations;
    }
    catch {
        return undefined;
    }
}
async function fetchWorldRegions(countryName, isoCode) {
    try {
        const data = await (0, node_fetch_1.default)(worldURL + "/" + isoCode.toLowerCase(), { timeout: 5000 });
        const dataText = await data.text();
        const dom = new jsdom_1.JSDOM(dataText, { virtualConsole });
        const elements = dom.window.document.querySelectorAll(".title > a");
        const stationLocations = [];
        for (let i = 0; i < elements.length; i++) {
            const item = elements.item(i);
            const href = item.href;
            let regionURL = href.substring(href.indexOf("/"));
            //stateName = querySelect("span");
            let name = "?";
            if ((regionURL.match(/\//g) || [])?.length >= 2) {
                const stateCode = regionURL.split("/")[1];
                if (!stateCode.startsWith("us"))
                    continue;
                const city = regionURL.split("/")[2].split(".")[0];
                name = stateCode.split("-")[1];
                name += (":" + city);
            }
            else {
                name = regionURL.split(".")[0];
            }
            stationLocations.push({ name: name, url: regionURL });
        }
        return stationLocations;
    }
    catch {
        return undefined;
    }
}
async function fetchStationsOfRegion(isoString, regionURL, isEuropean) {
    try {
        const isUSA = (isoString === "us");
        const headURL = (isEuropean ? europeanURL : worldURL);
        const baseURL = headURL + (!isUSA ? ("/" + isoString + (isoString !== "" ? "/" : "")) : "") + regionURL.split(".")[0];
        const data = await (0, node_fetch_1.default)(baseURL, { timeout: 5000 });
        const dataText = await data.text();
        const dom = new jsdom_1.JSDOM(dataText, { virtualConsole });
        const elements1 = dom.window.document.getElementsByClassName("rt0");
        const elements2 = dom.window.document.getElementsByClassName("rt1");
        const stations = [];
        let stationId = 0;
        for (let i = 0; i < (elements1.length + elements2.length); i++) {
            const query = (i + 1 <= elements1.length ? elements1.item(i) : elements2.item(i))?.querySelector("a");
            const title = query?.textContent?.trim();
            const imageURL = (headURL + query?.querySelector("img")?.src).replaceAll("../" + isoString, "/" + isoString);
            const href = query?.href;
            if (!href || href.startsWith("www") || href.startsWith("http"))
                continue;
            if (stations.find((element) => element.station_name === title))
                continue;
            const audioPlayerLink = (isEuropean ? (europeanURL + "/") : (worldURL + "/")) + href.substring(href.indexOf("/") + 1);
            const audioLink = await fetchAudioLink(audioPlayerLink);
            if (!audioLink)
                continue;
            stationId++;
            stations.push({ station_name: title || "?", station_id: stationId, image_url: imageURL, audio_url: audioLink });
        }
        return stations;
    }
    catch (err) {
        return undefined;
    }
}
async function fetchAudioLink(audioPlayerLink) {
    try {
        const data = await (0, node_fetch_1.default)(audioPlayerLink, { timeout: 5000 });
        const dataText = await data.text();
        const dom = new jsdom_1.JSDOM(dataText, { virtualConsole });
        const result = dom.window.document.querySelector("audio")?.src;
        if (!result)
            return;
        //test if audioconnection exists
        await (0, node_fetch_1.default)(result, { timeout: 5000, size: 100 });
        const audioStream = (0, voice_1.createAudioResource)(result).playStream;
        const probe = await (0, voice_1.demuxProbe)(new stream_1.Readable().wrap(audioStream), 1);
        //test if audioconnection exists end
        audioStream.destroy();
        if (probe.stream.readableLength <= 0) {
            probe.stream.destroy();
            return undefined;
        }
        probe.stream.destroy();
        return result;
    }
    catch {
        return undefined;
    }
}
exports.default = {
    fetchData: fetchData
};
