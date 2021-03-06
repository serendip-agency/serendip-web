#!/usr/bin/env node

var serendip = require("serendip");
var process = require("process");
var StatusController = require("../dist/StatusController");
var WebService = require("../dist/WebService");

var _ = require("underscore");

const chalk = require("chalk");
const clear = require("clear");
const figlet = require("figlet");
var argv = require("argv");
var path = require("path");
var dotenv = require("dotenv");
var fs = require("fs-extra");

dotenv.config();

figlet.parseFont(
  "isometric2",
  fs.readFileSync(path.join(__dirname, "isometric2.flf")).toString()
);

var localtunnel = require("localtunnel");
console.log("\n");
console.log(chalk.yellow(figlet.textSync("S", { font: "isometric2" })));
console.log("\n");

var args = argv
  .option([
    {
      name: "port",
      short: "p",
      type: "string"
    },
    {
      name: "help",
      short: "h",
      type: "boolean"
    },
    {
      name: "multi",
      short: "m",
      type: "boolean"
    },
    {
      name: "tunnel",
      short: "t",
      type: "boolean"
    },
    {
      name: "demo",
      type: "boolean"
    },
    {
      name: "example",
      type: "string"
    },
    {
      name: "dir",
      short: "d",
      type: "string"
    },
    {
      name: "tunnel-hostname",
      type: "string"
    },
    {
      name: "tunnel-subdomain",
      type: "string"
    }
  ])
  .run().options;

if (args.help) {
  console.log(chalk.bold("\nArguments:"));
  console.log(chalk.green("\t -d,--dir to specify directory"));
  console.log(chalk.green("\t -p,--port to specify port"));
  console.log(chalk.green("\t -t,--tunnel to enable local tunnel"));
  console.log(chalk.green("\t -h,--help to view help"));
  console.log(
    chalk.green(
      "\t -m,--multi to serve multiple websites. matches the hostname with folder in directory"
    )
  );
  console.log(
    chalk.green(
      "\t --example to create example folder with default template. (pick this in your first try)"
    )
  );
  console.log(
    chalk.green("\t --demo to preview without creating example folder")
  );

  console.log(chalk.bold("\nExamples:"));

  console.log(chalk.green("\tserendip-web -p 2020"));
  console.log(chalk.green("\tserendip-web -p 2020 -t"));
  console.log(chalk.green("\tserendip-web --port 8080"));
  console.log(chalk.green("\tserendip-web --port 8080 --tunnel\n\n"));

  return;
}

console.log(
  chalk.gray(
    "Starting arguments:\n" + JSON.stringify(args, null, "\t") + "\n\n"
  )
);

if (args.multi && args.multi != "false") {
  WebService.WebService.configure({
    sitesPath: args.dir || process.cwd()
  });
} else {
  WebService.WebService.configure({
    sitePath: args.dir || process.cwd()
  });
}

var demoPath = path.join(__dirname, "..", "www", "localhost");

if (args.demo && args.demo != "false") {
  WebService.WebService.configure({
    sitePath: demoPath
  });
}

if (args.example && args.example != "false") {
  var examplePath = path.join(
    process.cwd(),
    args.example.toString() != "true" ? args.example : "example"
  );

  fs.emptyDirSync(examplePath);
  fs.copySync(demoPath, examplePath);

  WebService.WebService.configure({
    sitePath: examplePath
  });
}

serendip.HttpService.configure({
  cors: "*",
  controllers: [StatusController.StatusController],
  httpPort: args.port || 2080,
  beforeMiddlewares: [WebService.WebService.processRequest]
});

serendip
  .start({
    logging: "info",
    cpuCores: 1,
    services: [WebService.WebService, serendip.HttpService]
  })
  .then(() => {
    if (args.tunnel) {
      var tunnel = localtunnel(
        args.port || 2080,
        {
          subdomain: args["tunnel-subdomain"],
          local_host: args["tunnel-hostname"] || "localhost"
        },
        function(err, tunnel) {
          console.log(
            "\n\tTemporary public url: " + chalk.green(tunnel.url) + "\n"
          );
        }
      );

      tunnel.on("close", function() {
        // tunnels are closed
      });
    }
  })
  .catch(msg => console.log(msg));
