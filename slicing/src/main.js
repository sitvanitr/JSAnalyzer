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

var parser_config = {range: true};

//var walk_options = {
//                    Literal : Literal,
//                    FunctionDeclaration: FunctionDeclaration,
//                    CallExpression : CallExpression,
//                    IfStatement : IfStatement
//                    };

//var input_file = "D:\\dev\\static\\js-parsing\\nodejs-example.js";
// var input_file = "D:\\dev\\static\\antlr\\javascript\\js-slicing\\examples\\web-components-examples-master\\popup-info-box-web-component\\main.js";
// var input_file = "D:\\dev\\static\\js-examples\\if.js";
// var input_file = "D:\\dev\\static\\js-examples\\small-if.js";
// var input_file = "D:\\dev\\static\\js-examples\\switch-end-default.js";
// var input_file = "D:\\dev\\static\\js-examples\\switch-common-block.js";
var input_file = "D:\\dev\\static\\js-examples\\switch-middle-default.js";

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
