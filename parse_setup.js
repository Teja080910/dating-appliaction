const fs = require('fs');
const data = JSON.parse(fs.readFileSync('live_v3.json', 'utf8'));

const setup = data.paths['/profile/{userId}/setup']?.post;
console.log("Params:", JSON.stringify(setup.parameters || []));
const ref = setup.requestBody?.content?.['application/json']?.schema?.['$ref'];
if (ref) {
    const schemaName = ref.split('/').pop();
    console.log("Schema:", schemaName);
    console.log(JSON.stringify(data.components.schemas[schemaName], null, 2));
} else {
    console.log("Schema from body directly:", JSON.stringify(setup.requestBody, null, 2));
}
