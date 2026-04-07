const fs = require('fs');
const data = JSON.parse(fs.readFileSync('live_v3.json', 'utf8'));

['/profile/update-details', '/profile/update-preferences', '/profile/update-basic'].forEach(path => {
    console.log(`\n== ${path} ==`);
    const put = data.paths[path]?.put;
    if (put) {
        console.log("Params:", JSON.stringify(put.parameters || []));
        const ref = put.requestBody?.content?.['application/json']?.schema?.['$ref'];
        if (ref) {
            const schemaName = ref.split('/').pop();
            console.log("Schema:", schemaName);
            console.log(JSON.stringify(data.components.schemas[schemaName], null, 2));
        } else {
            console.log("Schema from body directly:", JSON.stringify(put.requestBody, null, 2));
        }
    } else {
        console.log("Not found or not a PUT.");
    }
});
