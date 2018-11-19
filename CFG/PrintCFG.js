ASTVisitor = require('../AST/ASTVisitor');
module.exports = class PrintCFG extends ASTVisitor{
    printBinaryExpression(expr){
        console.log(expr.left, expr.op, expr.right);
    }

    printNode(node){

    }

    printCFG(cfg_nodes){
        console.log("CFG");
        console.log("====");

        for(var current_class in cfg_nodes){
            for(var current_function in cfg_nodes[current_class]){
                console.log(current_class, "-", current_function);
                console.log("---------");
                for (var key in cfg_nodes[current_class][current_function]){
                    
                    console.log(key, ":");
                    if (this.isDefaultCase(cfg_nodes[current_class][current_function][key].parser_node))
                        console.log(" default ");
                    // console.log( cfg_nodes[this.current_function_stack][key]);
                    console.log("parents[");
                    var num_parents = cfg_nodes[current_class][current_function][key].parents.length;
                    for (var i=0; i< num_parents; i++)
                        console.log(cfg_nodes[current_class][current_function][key].parents[i]);
                        // console.log(this.cfg_nodes[this.current_function_stack][key].parents);
                        console.log("]");
                    console.log("left:", cfg_nodes[current_class][current_function][key].left);
                    console.log("right:", cfg_nodes[current_class][current_function][key].right);
                    console.log("\n------------------------------------\n");
                }
                
            }
        }
    }


}

