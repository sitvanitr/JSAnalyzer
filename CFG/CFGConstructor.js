var esprima = require("D:/dev/static/node_modules/esprima/dist/esprima");
ASTVisitor = require('../AST/ASTVisitor');

var PrintCFG = require("./PrintCFG");
///////////////////////////////////////////////////////////
// cfg structure:
// key of node (in function) is node.type-node_start-node-end
// // To do: we need str for endblock node too.
// cfg key should be one of the following:
// class-method-node
// object-function-node
// global-function-node

// blockstatement in the cfg is the start-block.
// Statement are popped from this.node_stack when they are no longer needed to be attached as a parent.


// For each node we keep - a list of its parents.
// left child, right child if exist.
// At any time node_stack[this.current_function_stack] should contain all nodes which might have a direct successor which was not visited yet.
// For now it is poped only in branch nodes.

// If FunctionExpression/ClassExpression is named, then the name is local to the class/function body.
// A catch clause is treated as a new dummy function.

// todo:
// - Currently a return node has no children. Add dummy function end node and connect it as the return left child.


class CFGNode{
    constructor(node, id, type){
        this.id = id;
        this.parser_node = node;
        if (node)
            this.type = node.type;
        else
            this.type = type;
        this.test = null;
        this.parents = [];
        this.left = null;
        this.right = null;
        this.parser_left = null;  // for for in, for of
        this.parser_out = null;   // for for in, for of
        
    }
};


    var GLOBAL_METHOD =  "__*global_method";
    var GLOBAL_CLASS = "__*global_class";

    // We assume a class can have several functions.
    // We don't keep the relation function -> classes although a function can have many class expressions.
    // todo: try to fix it by adding the current function as part of the class name in createClassName().
    module.exports = class CFGConstructor extends ASTVisitor{
    constructor(){
        super();   
        
        this.current_node = 0;
        // this.current_class_stack = [];
        // this.current_class_stack.push(GLOBAL_CLASS);
        // this.current_class = GLOBAL_CLASS;
        this.current_class_stack_id = 0;
        // this.current_function_stack = {}; 
        // this.current_function_stack[GLOBAL_CLASS] = [];  
        // this.current_function_stack[GLOBAL_CLASS] .push(GLOBAL_METHOD);
        // this.current_function = GLOBAL_METHOD;
        // name of FunctionExpression we are in is the last in the stack.
        this.current_function_stack_id = 0;  // Id for dummy function names.
        this.initPerMethodStructures();
        this.initClassStructures(GLOBAL_CLASS);
        // this.cfg_nodes = {};
        // this.cfg_nodes[GLOBAL_CLASS] = {};
        // this.cfg_nodes[GLOBAL_CLASS][this.current_function] = {};
        this.printer = new PrintCFG();
        this.initMethodStructures(this.current_class, GLOBAL_METHOD);
        
    }


    initPerMethodStructuresForSwitch(){
        
        this.switch_head_stack = {};  // The last is the stack is the switch statement we are currently in
        this.default_case = {}; // default_case[class][function][switch_head_key] is the key of the default node
        this.last_case = {};
        this.num_cases = {};
        this.current_case = {};  // sequential number of current case in the current switch
        this.switch_var_stack = {};
        this.current_case_test = {};
        // this.switch_cases = {};
    }

    initPerMethodStructures(){ // for DFS on the ast
        this.current_class_stack = [];
        this.current_function_stack = {}; 
        this.cfg_nodes = {}; 
        this.node_stack = {};     
               
        this.loop_stack = {};  // for continue
        // this.switch_stack = {};
        this.label_to_node_str = {};  // for break <label>; dictionary of labeled blocks.
        this.label_to_end_block = {};
        this.loop_switch_end_stack = {};  // for break;
        this.initPerMethodStructuresForSwitch();       
        this.try_stack = {};
        this.catch_clauses = {};    
        this.function_end = {};  
    }

    initClassStructuresForSwitch(class_name){      
        this.switch_head_stack[class_name] = {};
        this.num_cases[class_name] = {};
        this.current_case[class_name] = {};  // sequential number of current case in the current switch   
        this.switch_var_stack[class_name] = {};
        this.default_case[class_name] = {};
        this.last_case[class_name] = {};
        this.current_case_test[class_name]  = {};
        
    }

    initClassStructures(class_name){
        this.current_class_stack.push(class_name);
        this.current_class = class_name;
        this.current_function_stack[class_name] = [];  
        this.cfg_nodes[class_name] = {};       
        this.node_stack[class_name] = {};       
        this.loop_stack[class_name] = {};
        // this.switch_stack[class_name] = {};
        this.label_to_node_str[class_name] = {};
        this.label_to_end_block[class_name] = {};
        this.loop_switch_end_stack[class_name] = {};
        this.initClassStructuresForSwitch(class_name);
        this.try_stack[class_name] = {};
        this.catch_clauses[class_name] = {};
        this.function_end[class_name] = {};
        
    }

    // These structures are for storing entries for loops and blocks in a function declaration.
    // The current method declaration has a stack of stacks.
    initMethodStructures(class_name, function_name)
    {
        this.current_function_stack[class_name].push(function_name);
        this.current_function = function_name;
        this.cfg_nodes[class_name][function_name] = {};
        this.node_stack[class_name][function_name] = [];      
        this.loop_stack[class_name][function_name] = []; // each entry is a stack of the node_str of the head of the inner loop.
        
        this.label_to_node_str[class_name][function_name] = {};
        this.label_to_end_block[class_name][function_name] = {};
        this.loop_switch_end_stack[class_name][function_name]  = [];
        this.initMethodStructureForSwitch(class_name, function_name);
        this.try_stack[class_name][function_name] = [];
        this.catch_clauses[class_name][function_name] = {};  // key is the try statement
        this.function_end[class_name][function_name] = undefined;
    }

    initMethodStructureForSwitch(class_name, function_name){
        this.switch_head_stack[class_name][function_name] = [];
        this.num_cases[class_name][function_name] = [];
        this.current_case[class_name][function_name] = [];  // sequential number of current case in the current switch       
        this.switch_var_stack[class_name][function_name] = [];
        this.default_case[class_name][function_name] = {};
        this.last_case[class_name][function_name] = []; 
        this.current_case_test[class_name][function_name] = new esprima.Nodes.Literal(true, "true");  // init case test to true;
        // this.switch_cases[class_name][function_name] = {};
    }

    deleteClassStructuresForSwitch(class_name){
        delete this.switch_head_stack[class_name];
        delete this.num_cases[class_name];
        delete this.current_case[class_name];
        delete this.switch_var_stack[class_name];
        delete this.default_case[class_name];
        delete this.last_case[class_name];
        delete this.current_case_test[class_name];
    }

    deleteClassStructures(class_name){
        this.current_class_stack.pop();
        var class_depth = this.current_class_stack.length;
        this.current_class = this.current_class_stack[class_depth -1];
        var function_depth = this.current_function_stack[this.current_class].length;
        if (function_depth>0)
            this.current_function = this.current_function_stack[this.current_class][function_depth-1];
        else
            this.current_function = undefined;
        delete this.current_function_stack[class_name];         
        delete this.node_stack[class_name];  
        delete this.loop_stack[class_name]; // each entry is a stack of the node_str of the head of the inner loop.
        // this.switch_stack[class_name][function_name] = [];
        delete this.label_to_node_str[class_name];
        delete this.label_to_end_block[class_name];
        delete this.loop_switch_end_stack[class_name];
        this.deleteClassStructuresForSwitch(class_name);
        delete this.try_stack[class_name];
        delete this.catch_clauses[class_name];
        delete this.function_end[class_name];
    }

    deleteMethodStructureForSwitch(class_name, function_name){
        delete this.switch_head_stack[class_name][function_name];
        delete this.num_cases[class_name][function_name];
        delete this.current_case[class_name][function_name];
        delete this.switch_var_stack[class_name][function_name];
        delete this.default_case[class_name][function_name];
        delete this.last_case[class_name][function_name];
        delete this.current_case_test[class_name][function_name];
    }

    deleteMethodStructures(class_name, function_name){
        this.current_function_stack[class_name].pop();
        var function_depth = this.current_function_stack[class_name].length;
        this.current_function = this.current_function_stack[class_name][function_depth -1];
        delete this.node_stack[class_name][function_name];  
        delete this.loop_stack[class_name][function_name]; // each entry is a stack of the node_str of the head of the inner loop.
        // this.switch_stack[class_name][function_name] = [];
        delete this.label_to_node_str[class_name][function_name];
        delete this.label_to_end_block[class_name][function_name];
        delete this.loop_switch_end_stack[class_name][function_name];
        this.deleteMethodStructureForSwitch(class_name, function_name);
        delete this.try_stack[class_name][function_name];
        delete this.catch_clauses[class_name][function_name];
        delete this.function_end[class_name][function_name];
    }

    // Here node in CFGNode. node.parser_node is either null (if new node) or the node returned in parsing.
    nodeKey(node){
        var node_str = "";
        if (node.parser_node)
            node_str = this.nodeStr(node.parser_node);
        else
            node_str = "Dummy" + "-" + node.type + "-" + node.id;
        return node_str;
    }

    endBlockKey(node, block_head){
        var node_str = "Dummy" + "-" + node.type + "-" + this.nodeStr(block_head);
        return node_str;
    }


    // connect the last visited node to the end of the embedding block/loop/if.
    // If the leaf is a jump node, the parameter should be the node to jump to.
    // For example - connect the leaf of the tne branch to the dummy end node of the if statement.
    // connectPreviousNodeAsParent(after_if_node_key)
    // {
    //     var stack_len = this.node_stack[this.current_class][this.current_function].length;  
    //     var leaf_key = this.node_stack[this.current_class][this.current_function][stack_len - 1]; // the leaf of the (then/if) branch or last visited node.       
    //     var leaf_node = this.cfg_nodes[this.current_class][this.current_function][leaf_key];
    //     if (!this.isBranchingNode(leaf_node) && !this.isJumpStatement(leaf_node)){    
    //         this.cfg_nodes[this.current_class][this.current_function][leaf_key].left = after_if_node_key;
    //         this.cfg_nodes[this.current_class][this.current_function][after_if_node_key].parents.push(leaf_key);
    //     }
    // }

    shouldConnectPreviousNodeAsParent(node_str, parent_node){
        var connect = !this.isIfNode(parent_node.parser_node) && 
        !this.isJumpStatement(parent_node.parser_node) &&
        !this.isDefaultCase(this.cfg_nodes[this.current_class][this.current_function][node_str].parser_node);
        return connect;
    }

    // connect node_str as the left child of the previous node
    connectPreviousNodeAsParent(node_str){
        var stack_len = this.node_stack[this.current_class][this.current_function].length;
        if (stack_len > 0){  // There is a previous node in the stack
            var parent_str = this.node_stack[this.current_class][this.current_function][stack_len - 1];
            var parent_node = this.cfg_nodes[this.current_class][this.current_function][parent_str]; 
            if (parent_node && this.shouldConnectPreviousNodeAsParent(node_str, parent_node)){// for ifStatment we connect in visitIfStatement
                console.log("adding parent ", parent_str);
                this.cfg_nodes[this.current_class][this.current_function][node_str].parents.push(parent_str);
                this.cfg_nodes[this.current_class][this.current_function][parent_str].left = node_str;
            }
        }
    }

    // Add a node to the cfg of this.current_function_stack if it is new. If the previous node is not a branching node, add the previous visited node as its parent,
    // and add this node as the parent's left child.
    // Argument: node - a node generated by the parser.
    addToCFG(node){
        var node_str = this.nodeStr(node);  
        console.log("addToCFG " , node.loc.start, node.loc.end);
        if (!(node_str in this.cfg_nodes[this.current_class][this.current_function])){  // add new node           
            console.log("adding new node to cfg" + node_str, node.loc);
            var cfg_node = new CFGNode(node, this.current_node, node.type);
            this.current_node++;
            this.cfg_nodes[this.current_class][this.current_function][node_str] = cfg_node;
            // this.str_to_node[node_str] = this.cfg_nodes[this.current_function_stack][node_str];
        }
        this.connectPreviousNodeAsParent(node_str);       
        return node_str;
    }

    createEndBlockNode(end_block_type, block_head)
    {
        var end_block = new CFGNode(null, this.current_node, end_block_type);      
        this.current_node++;
        var key = this.endBlockKey(end_block, block_head);
        this.cfg_nodes[this.current_class][this.current_function][key] = end_block;
        return key;
    }

    
 
    visitForStatement(node){
        if (node.init){
            this.visit(node.init);
            
        }
        var node_str = this.addToCFG(node);       
        
        this.node_stack[this.current_class][this.current_function].push(node_str);
        this.cfg_nodes[this.current_class][this.current_function][node_str].test = node.test;
        var end_loop_key = this.createEndBlockNode("EndLoopNode", node);
        this.loop_stack[this.current_class][this.current_function].push(node_str);  // push the loop head to the loop stack
        this.loop_switch_end_stack[this.current_class][this.current_function].push(end_loop_key);
        this.visit(node.body);
        if (node.update){
            
            this.visit(node.update);
        }
        this.afterLoop(end_loop_key);
    }

    visitIteratedForLoop(node){
        var for_key = this.addToCFG(node);
        this.node_stack[this.current_class][this.current_function].push(for_key);
        this.cfg_nodes[this.current_class][this.current_function][for_key].test = node.test;
        this.cfg_nodes[this.current_class][this.current_function][for_key].parser_left = node.left;
        this.cfg_nodes[this.current_class][this.current_function][for_key].parser_right = node.right;
        var end_loop_key = this.createEndBlockNode("EndLoopNode", node);
        this.loop_stack[this.current_class][this.current_function].push(for_key);  // push the loop head to the loop stack
        this.loop_switch_end_stack[this.current_class][this.current_function].push(end_loop_key);
        if (node.left)
            this.visitExpression(node.left);
        if (node.right)
            this.visitExpression(node.right);
        this.visit(node.body);
        this.afterLoop(end_loop_key);
    }

    visitForInStatement(node){
        this.visitIteratedForLoop(node);
    }

    visitForOfStatement(node){
        this.visitIteratedForLoop(node);
    }

    setFunctionName(node, dummy_function){
        if (node.type == "MethodDefinition")
            return node.key.name;
        var function_name = null;
        if (!dummy_function && !(node.id==null))
            function_name = node.id.name;
        if (function_name == null){
            function_name = this.createFunctionName();           
        }
        return function_name;
    }

    processFunctionContent(node, function_name){
        // this.cfg_nodes[this.current_class][function_name] = {};
        // this.current_function = function_name;
        this.initMethodStructures(this.current_class, function_name);
        var current_function_end = this.createEndBlockNode("FunctionEnd", node);
        this.function_end[this.current_class][this.current_function] = current_function_end;
        // this.current_function_stack[this.current_class].push(function_name);       
        // if (!(this.current_function_stack == GLOBAL_METHOD))
        //     this.addToCFG(node);   
        var key = this.addToCFG(node);
        this.node_stack[this.current_class][this.current_function].push(key);
        this.visit(node.body);
        this.connectPreviousNodeAsParent(current_function_end);  // connect switch end as child of last statement in the switch
        this.popUntilNode(key);
        this.node_stack[this.current_class][this.current_function].pop();
        this.deleteMethodStructures(this.current_class, this.current_function); // going out of this method
        
    }
    
    processFunctionDeclaration(node, dummy_function){      
        var function_name = this.setFunctionName(node, dummy_function);
        this.processFunctionContent(node, function_name);      
    }

    // To get the parameters of a method - this.cfg_nodes[method_id].parser_node.parameters
    visitFunctionDeclaration(node){
        var function_name = this.setFunctionName(node, false);
        this.processFunctionContent(node, function_name);   
    }

    visitDefaultNode(node){
        var key = this.addToCFG(node);
        this.node_stack[this.current_class][this.current_function].push(key);
    }

    visitIfStatement(node){
        
        var node_str = this.addToCFG(node);  
        this.node_stack[this.current_class][this.current_function].push(node_str);  
        var after_if_node_key = this.createEndBlockNode("IfEndBlock", node);
        var child_str = this.nodeStr(node.consequent);
        this.cfg_nodes[this.current_class][this.current_function][node_str].left = child_str;       
        if (node.test){
            this.cfg_nodes[this.current_class][this.current_function][node_str].test = node.test;
            this.visitExpression(node.test);
        }

        this.visit(node.consequent);  // dfs
        this.cfg_nodes[this.current_class][this.current_function][child_str].parents.push(node_str);
        this.connectPreviousNodeAsParent(after_if_node_key);
        this.popUntilNode(node_str);
        if (node.alternate) {  // else branch
            child_str = this.nodeStr(node.alternate);
            this.cfg_nodes[this.current_class][this.current_function][node_str].right = child_str;
            this.visit(node.alternate);
            this.cfg_nodes[this.current_class][this.current_function][child_str].parents.push(node_str);
            this.connectPreviousNodeAsParent(after_if_node_key);
            this.popUntilNode(node_str);
        }
        else{
            this.cfg_nodes[this.current_class][this.current_function][node_str].right = after_if_node_key;
            this.cfg_nodes[this.current_class][this.current_function][after_if_node_key].parents.push(node_str);
        }
        this.node_stack[this.current_class][this.current_function].pop();  // pop the if statement
        this.node_stack[this.current_class][this.current_function].push(after_if_node_key);   // push the dummy end block  
    }


    // label: statement
    visitLabelledStatement(node){
        this.addToCFG(node);
        this.node_stack[this.current_class][this.current_function].push(this.nodeStr(node));
        var end_labeled_block_key  = this.createEndBlockNode("LabeledBlockEnd", node);
        this.label_to_node_str[node.label] = this.nodeStr(node);
        this.label_to_end_block[node.label] = end_labeled_block_key;
        this.visit(node.body);
        // pop until node?
        this.node_stack[this.current_class][this.current_function].push(end_labeled_block);
    }

    popNonBranchingAncestors(){
        var function_stack_len = this.node_stack[this.current_class][this.current_function].length; 
        var ended = false;              
        while (function_stack_len > 0 && !ended){
            var last_key = this.node_stack[this.current_class][this.current_function][function_stack_len - 1];   
            var last_node = this.cfg_nodes[this.current_class][this.current_function][last_key];   
            if(!this.isBranchingNode(last_node.parser_node)){
                this.node_stack[this.current_class][this.current_function].pop();
                function_stack_len = this.node_stack[this.current_class][this.current_function].length;
            }
            else    
                ended = true;
        }   
    }

    popUntilNode(node_key)
    {
        var function_stack_len = this.node_stack[this.current_class][this.current_function].length;
        var last_key = this.node_stack[this.current_class][this.current_function][function_stack_len - 1];      
        while (!(last_key == node_key)){           
            this.node_stack[this.current_class][this.current_function].pop();
            function_stack_len--;
            last_key = this.node_stack[this.current_class][this.current_function][function_stack_len - 1]; 
        }
    }

    // Continue node should not enter this.node_stack[this.current_function_stack].
    // The child of the continue node is the head of the inner loop in loop_stack.
    visitContinueStatement(node){
        this.addToCFG(node);
        var node_str = this.nodeStr(node);
        var loop_stack_len = this.loop_stack[this.current_class][this.current_function].length;
        var loop_head = this.loop_stack[this.current_class][this.current_function][loop_stack_len - 1];
        this.cfg_nodes[this.current_class][this.current_function][node_str].left = loop_head; // add the inner loop head as the continue node child;
        this.cfg_nodes[this.current_class][this.current_function][loop_head].parents.push(node_str);
        this.popNonBranchingAncestors() // should pop ancestors until if orloop
        this.node_stack[this.current_class][this.current_function].push(node_str); // in order not to connect as parent
    }

    // break; break out of switch or loop
    // break label; break from the block labeled "label"
    visitBreakStatement(node){
        this.addToCFG(node);
        var node_str = this.nodeStr(node);
        var after_break = undefined;
        if (node.label){   // break label
            after_break = this.label_to_end_block[this.current_class][this.current_function][node.label];
        }
        else{
            var break_end_len = this.loop_switch_end_stack[this.current_class][this.current_function].length;
            after_break = this.loop_switch_end_stack[this.current_class][this.current_function][break_end_len - 1];
        }
        this.cfg_nodes[this.current_class][this.current_function][node_str].left = after_break; // add the inner loop head as the continue node child;
        this.cfg_nodes[this.current_class][this.current_function][after_break].parents.push(node_str);
        // this.popNonBranchingAncestors() // should pop ancestors until if/loop
        this.node_stack[this.current_class][this.current_function].push(node_str); // in order not to connect as parent
    }

    visitBlockStatement(node){
        var block_key = this.addToCFG(node); // start of block 
        var node_str = this.nodeStr(node); 
        var end_block_key = this.createEndBlockNode("EndBlockNode", node);
        this.node_stack[this.current_class][this.current_function].push(block_key);
        var body_len = node.body.length;
        for (var i=0; i<body_len; i++){
            this.visit(node.body[i]);
        }  
        // var function_stack_len =   this.node_stack[this.current_class][this.current_function].length;
        // var last_key = this.node_stack[this.current_class][this.current_function][function_stack_len - 1];
        // var last_in_block = this.cfg_nodes[this.current_class][this.current_function][last_key];
        // last_in_block.left = end_block_key;
        // this.cfg_nodes[this.current_class][this.current_function][end_block_key].parents.push(last_in_block);
        this.connectPreviousNodeAsParent(end_block_key); // don't connect jump nodes to end block. They are treated 
        // in the jump statement.
        this.node_stack[this.current_class][this.current_function].push(end_block_key);
    }

    // Add the loop head to the cfg. Create a dummy node for after the loop and push it to the end nodes stack.
    beforeLoop(node){
        var node_str = this.addToCFG(node);
        this.node_stack[this.current_class][this.current_function].push(node_str);
        this.cfg_nodes[this.current_class][this.current_function][node_str].test = node.test;
        var end_loop_key = this.createEndBlockNode("EndLoopNode", node);
        this.loop_stack[this.current_class][this.current_function].push(node_str);
        this.loop_switch_end_stack[this.current_class][this.current_function].push(end_loop_key);
        return end_loop_key;
    }

    afterLoop(end_loop_key){
        this.connectPreviousNodeAsParent(end_loop_key);
        this.popNonBranchingAncestors(); // now the loop head should be at the top of the stack
        this.loop_stack[this.current_class][this.current_function].pop();
        this.loop_switch_end_stack[this.current_class][this.current_function].pop();
        this.node_stack[this.current_class][this.current_function].pop(); // pop the loop head;
        this.node_stack[this.current_class][this.current_function].push(end_loop_key); // to be connected to the following statement
    }

    processWhileLoop(node){
        var end_loop_key = this.beforeLoop(node);  
        this.visit(node.body);
        this.afterLoop(end_loop_key);
    
    }

    visitDoWhileStatement(node){
        this.processWhileLoop(node);
    }

    visitWhileStatement(node){
        this.processWhileLoop(node);
    }

    deleteCurrentSwitchData()
    {
        this.switch_head_stack[this.current_class][this.current_function].pop();   // pop the switchstatement node
        this.loop_switch_end_stack[this.current_class][this.current_function].pop(); // pop the switch end from the stack for break
        delete this.default_case[this.current_class][this.current_function][node_str]; // delete the default node of this switch  

    }

    initSwitchData(node, node_str){   
        this.switch_head_stack[this.current_class][this.current_function].push(node_str);
        this.num_cases[this.current_class][this.current_function].push(node.cases.length);
        this.current_case[this.current_class][this.current_function].push(0);
        this.switch_var_stack[this.current_class][this.current_function].push(node.discriminant);
    }

    deleteSwitchData(){
        this.switch_head_stack[this.current_class][this.current_function].pop();
        this.num_cases[this.current_class][this.current_function].pop();
        this.current_case[this.current_class][this.current_function].pop();
        this.switch_var_stack[this.current_class][this.current_function].pop();
        this.loop_switch_end_stack[this.current_class][this.current_function].pop();
    }

    // put default case as last in the array of cases
    // not effective because in the case of default in the middle, when the last case does not have a break we don't 
    // want it to continue to the default.
    // sortSwitchCases(node, node_str){
    //     this.switch_cases[this.current_class][this.current_function][node_str] = [];
    //     var ind = 0;
    //     var default_case = null;
    //     for (var i=0; i<node.cases.length; i++){
    //         if (this.isDefaultCase(node.cases[i]))
    //             default_case = node.cases[i];
    //         else{
    //             this.switch_cases[this.current_class][this.current_function][node_str][ind] = node.cases[i];
    //             ind++;
    //         }
    //     }
    //     this.switch_cases[this.current_class][this.current_function][node_str][ind] = default_case;
    // }

    visitSwitchStatement(node){   
        var node_str = this.addToCFG(node);   
        this.initSwitchData(node, node_str);  
        this.node_stack[this.current_class][this.current_function].push(node_str);  
        var after_switch_node_key = this.createEndBlockNode("SwitchEndBlock", node);
        this.loop_switch_end_stack[this.current_class][this.current_function].push(after_switch_node_key);
 
        for (var c in node.cases){
            var switch_depth = this.current_case[this.current_class][this.current_function].length;
            this.current_case[this.current_class][this.current_function][switch_depth-1]++;
            this.visit(node.cases[c]);
        }
        this.connectPreviousNodeAsParent(after_switch_node_key);  // connect switch end as child of last statement in the switch
        this.popUntilNode(node_str);  
        this.deleteSwitchData();
        this.node_stack[this.current_class][this.current_function].pop();  // pop the switchstatement node
        this.node_stack[this.current_class][this.current_function].push(after_switch_node_key);   // push the dummy end block 
    }

    parentIsSwitchCase(){
        var node_stack_len = this.node_stack[this.current_class][this.current_function].length;
        var parent_key = this.node_stack[this.current_class][this.current_function][node_stack_len-1];
        var switch_stack = this.cfg_nodes[this.current_class][this.current_function];
        var parent = switch_stack[parent_key];
        console.log("parent type" + parent.type);
        return this.cfg_nodes[this.current_class][this.current_function][parent_key].type == "SwitchCase";
    }

    addNewSwitchCase(node){
        var node_str = this.addToCFG(node); 
        this.node_stack[this.current_class][this.current_function].push(node_str);
        this.cfg_nodes[this.current_class][this.current_function][node_str].test = this.current_case_test[this.current_class][this.current_function];   
            
        var default_case = this.isDefaultCase(node);
        var stack_len = this.switch_head_stack[this.current_class][this.current_function].length;
        var switch_head = this.switch_head_stack[this.current_class][this.current_function][stack_len - 1];
        if (default_case){       
            this.default_case[this.current_class][this.current_function][switch_head] = node_str;           
        }
        var switch_depth = this.num_cases[this.current_class][this.current_function].length;

        var at_last_case = (this.current_case[this.current_class][this.current_function][switch_depth-1] == 
        this.num_cases[this.current_class][this.current_function][switch_depth-1]);
        
        if (!default_case || (default_case && at_last_case)){
        // connect the node as "else" of the previous case
            var last_case_len = this.last_case[this.current_class][this.current_function].length;
            if (last_case_len > 0){
                // pop the last case of the current function in order to update it later to node_str.
                var last_case = this.last_case[this.current_class][this.current_function].pop();
                this.cfg_nodes[this.current_class][this.current_function][node_str].parents.push(last_case);
                this.cfg_nodes[this.current_class][this.current_function][last_case].right = node_str;
            }
        }
        if (at_last_case){
                if (!default_case){ // last case is not default
                    if (switch_head in this.default_case[this.current_class][this.current_function]){ // default exists
                        var default_case = this.default_case[this.current_class][this.current_function][switch_head];
                        this.cfg_nodes[this.current_class][this.current_function][default_case].parents.push(node_str);
                        this.cfg_nodes[this.current_class][this.current_function][node_str].right = default_case;
                    }
            }
        }
        // var after_case_node_key = this.createEndBlockNode("CaseEndBlock");
        for (var st in node.consequent){
            this.visit(node.consequent[st]);
        }
        // this.connectPreviousNodeAsParent(after_case_node_key, false); // for the case the case block does not end with break.
        // this.popUntilNode(node_str);
        // this.node_stack[this.current_class][this.current_function].pop(); // pop the case node
        // this.node_stack[this.current_class][this.current_function].push(after_case_node_key);   // push the dummy end block 
        // update last case stacks         
        // this.node_stack[this.current_class][this.current_function].pop();  // pop the case node
        if (!default_case)
            this.last_case[this.current_class][this.current_function].push(node_str); 
        else{  // pop the default from the stack as it should not be connected as parent
            this.popUntilNode(node_str);
            this.node_stack[this.current_class][this.current_function].pop();
        }
    }

    // The structure of the cfg of switch:
    // node for the switch statement.
    // one switch case node for each sequence of consecutive case tests case 1: case 2:. The test of the node is or of the consecutive tests
    // at most one default case as the last case node.
    // dummy  SwitchEndBlock node.
    visitSwitchCase(node){
        if (!this.parentIsSwitchCase())  // not the case of the form case 1:
                                         //                          case 2:
            this.current_case_test[this.current_class][this.current_function] = new esprima.Nodes.Literal(true, "true");  // init case test to true
        
        var switch_depth = this.switch_var_stack[this.current_class][this.current_function].length;
        var this_test = new esprima.Nodes.BinaryExpression('==', this.switch_var_stack[this.current_class][this.current_function][switch_depth-1], node.test);       
        this.current_case_test[this.current_class][this.current_function] = new esprima.Nodes.BinaryExpression('||', 
                                               this.current_case_test[this.current_class][this.current_function], this_test);
        this.printer.printBinaryExpression(this.current_case_test[this.current_class][this.current_function]);
        if (node.consequent.length >0){ 
           this.addNewSwitchCase(node); 
        } 
    }

    // interface ClassDeclaration {
    //     type: 'ClassDeclaration';
    //     id: Identifier | null;
    //     superClass: Identifier | null;
    //     body: ClassBody;
    // }
    processClassDeclaration(node){
        console.log("visitClassDeclaration ", node);
        var class_name = node.id;
        if (class_name == null || node.id.name == null){
            class_name = this.createClassName(node);           
        }
        else
            class_name = node.id.name;
        // this.current_class_stack.push(class_name);
        // this.current_class = class_name;
        // this.cfg_nodes[class_name] = {};
        this.initClassStructures(class_name);
        this.visit(node.body);
        this.deleteClassStructures(class_name);
    }

    visitClassDeclaration(node){
        this.processClassDeclaration(node);
    }

    visitClassExpression(node){
        this.processClassDeclaration(node);
    }

    visitClassBody(node){
        console.log("visitClassBody ", node);
        for (var i = 0, list = node.body; i < list.length; i += 1)
            {
            var method = list[i];         
            this.visit(method);
          }
    }

    // interface MethodDefinition {
    //     type: 'MethodDefinition';
    //     key: Expression | null;
    //     computed: boolean;
    //     value: FunctionExpression | null;
    //     kind: 'method' | 'constructor';
    //     static: boolean;
    // }
    // Creates a function in the cfg structures with the name of the method (from node.key).
    visitMethodDefinition(node){
        this.visitExpression(node.key);
        var function_name = this.setFunctionName(node, false);
        this.processFunctionContent(node.value, function_name); // process the FunctionExpression node
    }

    visitVariableDeclaration(node){
        this.visitDefaultNode(node);
        for(var i=0; i< node.declarations.length; i++){
            if (node.declarations[i].init)
                this.visitExpression(node.declarations[i].init);
        }
    }

    // The key of the catch clause is stored in this.catch_clauses[this.current_class][this.current_function][try_key]
    // The finalizer is added as the continuation of the try statement.
    visitTryStatement(node){
        var key = this.addToCFG(node);
        this.node_stack[this.current_class][this.current_function].push(key);
        var after_try_node_key = this.createEndBlockNode("TryEndBlock", node);
        this.visit(node.block);
        this.catch_clauses[this.current_class][this.current_function][key] = this.nodeStr(node.handler);
        this.visit(node.handler); // new functions for catch clauses
        if (node.finalizer)
            this.visit(node.finalizer);
        this.connectPreviousNodeAsParent(after_try_node_key);  // connect switch end as child of last statement in the switch
        this.popUntilNode(key); 
        this.node_stack[this.current_class][this.current_function].pop();  // pop the trystatement node
        this.node_stack[this.current_class][this.current_function].push(after_try_node_key);   // push the dummy end block  
    }


    // Create a new function in cfg_nodes and process the catch clause as a function.
    // todo: Create another dictionary that stores try to catch function.
    visitCatchClause(node){
        this.processFunctionDeclaration(node, true);
    }

    visitReturnStatement(node){
        var key = this.addToCFG(node);
        if (node.argument){
            this.visitExpression(node.argument);
        }
        var current_function_end = this.function_end[this.current_class][this.current_function];
        this.cfg_nodes[this.current_class][this.current_function][current_function_end].parents.push(key);
        this.cfg_nodes[this.current_class][this.current_function][key].left = current_function_end;
        this.node_stack[this.current_class][this.current_function].push(key);
    }  


    //////////////////////////////////////////////////////////
    // Expression visitor
    //////////////////////////////////////////////////////////
    createFunctionName(){
        var function_name = "DUMMY_FUNCTION" + this.current_function_stack_id;
        this.current_function_stack_id++;
        return function_name;
    }

    createClassName(){
        var class_name = "DUMMY_CLASS" + this.current_class_stack_id;
        this.current_class_stack_id++;
        return class_name;
    }

    visitFunctionExpression(node){
        this.processFunctionDeclaration(node, true);
    }

    visitExpressionStatement(node){
            this.visitDefaultNode(node);
            this.visitExpression(node.expression);
    }

    visitCallExpression(node){
        var num_args = node.arguments.length
        for (var arg=0; arg<num_args; arg++){
            this.visitExpression(node.arguments[arg]);
        }
    }

};  