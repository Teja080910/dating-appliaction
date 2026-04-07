const fs = require('fs');
const data = JSON.parse(fs.readFileSync('live_v3.json', 'utf8'));

Object.entries(data.components.schemas).forEach(([name, schema]) => {
    if (schema.properties && (schema.properties.englishLevel || schema.properties.ethnicity)) {
        console.log("Schema:", name);
        console.log(JSON.stringify(schema.properties, null, 2));
    }
});
