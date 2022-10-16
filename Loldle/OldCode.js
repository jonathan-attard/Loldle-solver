async function GetChampions() {
  const options = {
    host: "ddragon.leagueoflegends.com",
    path: "/cdn/6.24.1/data/en_US/champion.json",
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
        resolve(Object.keys(jdval["data"]));
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

function parseNames(names) {
  var arrayLength = names.length;
  for (var i = 0; i < arrayLength; i++) {
      names[i] = names[i].replace(/([A-Z])/g, ' $1').replace(/^./, function(str){ return str.toUpperCase(); }).substring(1);  // https://stackoverflow.com/questions/4149276/how-to-convert-camelcase-to-camel-case
  }
}
