//var acorn = require("acorn");
//var jsx = require("acorn-jsx");
//console.log("jsx is " + jsx.constructor.name);
//var JSXParser = acorn.Parser.extend(jsx);
//JSXParser.parse("foo(<bar/>)");

// To do:
// CallTreeConstructor - construct the call tree. A list of nodes. each node: function_name, parents, children.
// ASTConstructor - construct a "real" ast where each node has parents and children.
// Declaration Finder - given a list of identifiers, finds the location of their declarations/ returns the first declaration.
// SlicerVisitor - find the location of a call of the function given as argument and find the location of its argument.
// declarations using Declaration Finder.
// flow:
// construct call tree.
// construct real ast.
// find function call

var esprima = require("D:/dev/static/js-parsing/node_modules/esprima");
const utils = require("./utils");

var fs = require("fs");

var parse_options = {
        ecmaVersion: 6,
        locations: true,
        sourceType: "module"
    };

var parser_config = {range: true, loc:true};

//var walk_options = {
//                    Literal : Literal,
//                    FunctionDeclaration: FunctionDeclaration,
//                    CallExpression : CallExpression,
//                    IfStatement : IfStatement
//                    };

//var input_file = "D:\\dev\\static\\js-parsing\\nodejs-example.js";
// var input_file = "D:\\dev\\static\\js-examples\\main.js";
// var input_file = "D:\\dev\\static\\js-examples\\branching\\if.js";
// var input_file = "D:\\dev\\static\\js-examples\\branching\\small-if.js";
// var input_file = "D:\\dev\\static\\js-examples\\branching\\switch-end-default.js";
// var input_file = "D:\\dev\\static\\js-examples\\branching\\switch-common-block.js";
// var input_file = "D:\\dev\\static\\js-examples\\branching\\switch-middle-default.js";
// var input_file = "D:\\dev\\static\\js-examples\\loops\\for-var.js";
// var input_file = "D:\\dev\\static\\js-examples\\loops\\for-true.js";
// var input_file = "D:\\dev\\static\\js-examples\\loops\\for-no-update.js";
// var input_file = "D:\\dev\\static\\js-examples\\loops\\small-while.js";
// var input_file = "D:\\dev\\static\\js-examples\\loops\\for-in.js";
// var input_file = "D:\\dev\\static\\js-examples\\branching\\try.js";
// var input_file = "D:\\dev\\static\\js-examples\\branching\\small-try.js";
// var input_file = "D:\\dev\\static\\js-examples\\jump\\break.js";
// var input_file = "D:\\dev\\static\\js-examples\\jump\\continue.js";
// var input_file = "D:\\dev\\static\\js-examples\\jump\\return1.js";
// var input_file = "D:\\javascript\\learn\\samples\\webgl\\particles\\demo.js";
// var input_file = "D:\\javascript\\learn\\samples\\webgl\\array-unit-tests\\tests.js";
// var input_file = "D:\\javascript\\learn\\samples\\webgl\\image-texture-test\\demo.js";
// var input_file = "D:\\javascript\\learn\\samples\\webgl\\procedural-texture-test\\demo.js";
// var input_file = "D:\\javascript\\learn\\samples\\webgl\\resources\\cameracontroller.js";
// var input_file = "D:\\javascript\\learn\\samples\\webgl\\resources\\fpscounter.js";
// var input_file = "D:\\dev\\static\\antlr\\javascript\\examples\\ArrowFunctions.js";
// var input_file = "D:\\dev\\static\\antlr\\javascript\\examples\\Classes.js";
// var input_file = "D:\\dev\\static\\antlr\\javascript\\examples\\ClassInNonGlobalStrict.js";
// var input_file = "D:\\dev\\static\\antlr\\javascript\\examples\\Constants.js";
// var input_file = "D:\\dev\\static\\antlr\\javascript\\examples\\StrictFunctions.js";
// var input_file = "D:\\dev\\static\\js-examples\\web-components-examples-master\\composed-composed-path\\main.js";
var input_file = "D:\\dev\\static\\js-examples\\web-components-examples-master\\defined-pseudo-class\\main.js";
// var input_file = "D:\\dev\\static\\js-examples\\web-components-examples-master\\editable-list\\main.js";
// var input_file = "D:\\dev\\static\\js-examples\\web-components-examples-master\\edit-word\\main.js";
// var input_file = "D:\\dev\\static\\js-examples\\web-components-examples-master\\element-details\\main.js";
// var input_file = "D:\\dev\\static\\js-examples\\web-components-examples-master\\expanding-list-web-component\\main.js";
// var input_file = "D:\dev\static\js-examples\web-components-examples-master\host-selectors\\main.js"


var file_str;
function readToString(){
    console.log("before read file");
    file_str = fs.readFileSync(input_file, "utf8");
    // fs.readFile(input_file, "utf8", async function (err, data) {
//         if (err) throw err;

//         await utils.sleep(2000);
//         file_str = data;
// //        console.log(file_str);
// //        await sleep(2000);
//         console.log("after read file");
//     });
}

//async function parseString(file_str)
//{
//    await sleep(5000);
//    //var file_str = FileReader.readAsText("../node_modules/acorn-walk");
//    console.log("before ast");
//    //var ast = acorn.parse("D:\\javascript\\learn\\samples\\webgl\\particles\\demo.js");
//    var ast = acorn.parse(file_str);
//    await sleep(2000);
//     console.log("after ast");
//     // walk.simple(acorn.parse("let x = 10"), {
//        walk.simple(ast,{
//          Literal(node) {
//            console.log(`Found a literal: ${node.value}`)
//            }
//        })
//}



async function parseString()
{
    var ast = null;
    try{
        await utils.sleep(5000);
//        var lines = file_str.split("\n");
//        console.log("len = ", lines.length);
//        ast = acorn.parse(file_str ,parse_options);
            ast = esprima.parseScript(file_str, parser_config);
//            await sleep(5000);
//            // set up AST walk handlers
//                Object.keys(walk.base).forEach(function eacher(type){
//                    console.log("type =" + type);
//                    if (!(type in walk_options))
//                        walk_options[type] = visitNode;
////                    walk_options[type] = type;
//                    });
//
//               walk.simple(ast, walk_options);
            //        walk.recursive(ast, null, walk_options);

        }
    catch(e){
        console.log("Exception" + e.message);
    }
return ast;
}

var CFGConstructor = require("../../CFG/CFGConstructor");
var PrintCFG = require("../../CFG/PrintCFG");


async function main()
{
// the argument is the name of the function we are looking for
    var args = process.argv.slice(2);
    console.log(args);
    readToString();
    var ast = await parseString();

    var visitor = new CFGConstructor();
    visitor.visit(ast);
    var printer = new PrintCFG();
    printer.printCFG(visitor.cfg_nodes);
}

main();
