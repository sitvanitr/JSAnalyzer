ASTVisitor = require('./ASTVisitor');
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
        this.current_class_stack = [];
        this.current_class_stack.push(GLOBAL_CLASS);
        this.current_class = GLOBAL_CLASS;
        this.current_class_stack_id = 0;
        this.current_function_stack = {}; 
        this.current_function_stack[GLOBAL_CLASS] = [];  
        this.current_function_stack[GLOBAL_CLASS] .push(GLOBAL_METHOD);
        this.current_function = GLOBAL_METHOD;
        // name of FunctionExpression we are in is the last in the stack.
        this.current_function_stack_id = 0;  // Id for dummy function names.
        this.initPerMethodStructures();
        this.initClassStructures(GLOBAL_CLASS);
        this.cfg_nodes = {};
        this.cfg_nodes[GLOBAL_CLASS] = {};
        this.cfg_nodes[GLOBAL_CLASS][this.current_function] = {};
        this.initMethodStructures(this.current_class, this.current_function);
    }

    initPerMethodStructures(){ // for DFS on the ast
        this.node_stack = {};
        
        this.loop_stack = {};  // for continue
        // this.switch_stack = {};
        this.label_to_node_str = {};  // for break <label>; dictionary of labeled blocks.
        this.label_to_end_block = {};
        this.loop_switch_end_stack = {};  // for break;
        this.switch_head_stack = {};  // The last is the stack is the switch statement we are currently in
        this.default_case = {}; // default_case[class][function][switch_head_key] is the key of the default node
        this.last_case = {};
        this.try_stack = {};
        this.catch_clauses = {};
    }

    initClassStructures(class_name){
        this.node_stack[class_name] = {};       
        this.loop_stack[class_name] = {};
        // this.switch_stack[class_name] = {};
        this.label_to_node_str[class_name] = {};
        this.label_to_end_block[class_name] = {};
        this.loop_switch_end_stack[class_name] = {};
        this.switch_head_stack[class_name] = {};
        this.default_case[class_name] = {};
        this.last_case[class_name] = {}; 
        this.try_stack[class_name] = {};
        this.catch_clauses[class_name] = {};
    }

    // These structures are for storing entries for loops and blocks in a function declaration.
    // The current method declaration has a stack of stacks.
    initMethodStructures(class_name, function_name)
    {
        this.node_stack[class_name][function_name] = [];      
        this.loop_stack[class_name][function_name] = []; // each entry is a stack of the node_str of the head of the inner loop.
        // this.switch_stack[class_name][function_name] = [];
        this.label_to_node_str[class_name][function_name] = {};
        this.label_to_end_block[class_name][function_name] = {};
        this.loop_switch_end_stack[class_name][function_name]  = [];
        this.switch_head_stack[class_name][function_name] = [];
        this.default_case[class_name][function_name] = {};
        this.last_case[class_name][function_name] = []; 
        this.try_stack[class_num][function_num] = [];
        this.catch_clauses[class_name][function_num] = {};  // key is the try statement
    }

    deleteClassStructures(class_name){
        delete this.node_stack[class_name];  
        delete this.loop_stack[class_name]; // each entry is a stack of the node_str of the head of the inner loop.
        // this.switch_stack[class_name][function_name] = [];
        delete this.label_to_node_str[class_name];
        delete this.label_to_end_block[class_name];
        delete this.loop_switch_end_stack[class_name];
        delete this.switch_head_stack[class_name];
        delete this.default_case[class_name];
        delete this.last_case[class_name];
        delete this.try_stack[class_num];
    }

    deleteMethodStructures(class_name, function_name){
        delete this.node_stack[class_name][function_name];  
        delete this.loop_stack[class_name][function_name]; // each entry is a stack of the node_str of the head of the inner loop.
        // this.switch_stack[class_name][function_name] = [];
        delete this.label_to_node_str[class_name][function_name];
        delete this.label_to_end_block[class_name][function_name];
        delete this.loop_switch_end_stack[class_name][function_name];
        delete this.switch_head_stack[class_name][function_name];
        delete this.default_case[class_name][function_name];
        delete this.last_case[class_name][function_name];
        delete this.try_stack[class_num][function_name];
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

    

    // Add a node to the cfg of this.current_function_stack if it is new. If the previous node is not a branching node, add the previous visited node as its parent,
    // and add this node as the parent's left child.
    // Argument: node - a node generated by the parser.
    addToCFG(node){
        var node_str = this.nodeStr(node);
        
        console.log("addToCFG ", node_str);
        if (!(node_str in this.cfg_nodes[this.current_class][this.current_function])){  // add new node           
            console.log("adding new node to cfg");
            var cfg_node = new CFGNode(node, this.current_node, node.type);
            this.current_node++;
            this.cfg_nodes[this.current_class][this.current_function][node_str] = cfg_node;
            // this.str_to_node[node_str] = this.cfg_nodes[this.current_function_stack][node_str];
        }
        var stack_len = this.node_stack[this.current_class][this.current_function].length;
        if (stack_len > 0){  // There is a previous node in the stack
            var parent_str = this.node_stack[this.current_class][this.current_function][stack_len - 1];
            var parent_node = this.cfg_nodes[this.current_class][this.current_function][parent_str]; 
            if (!parent_node)
                console.log("NULL PARENT");  
            if (!this.isJumpStatement(parent_node.parser_node) ){      
                console.log("adding parent ", parent_str);
                this.cfg_nodes[this.current_class][this.current_function][node_str].parents.push(parent_str);
            }
            if (parent_node && !this.isIfNode(parent_node.parser_node) && 
                !this.isJumpStatement(parent_node.parser_node) )// for ifStatment we connect in visitIfStatement
                this.cfg_nodes[this.current_class][this.current_function][parent_str].left = node_str;
        }
        
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

    printCFG(){
        console.log("CFG");
        console.log("====");

        for(var current_class in this.cfg_nodes){
            for(var current_function in this.cfg_nodes[current_class]){
                console.log(current_class, "-", current_function);
                console.log("---------");
                for (var key in this.cfg_nodes[current_class][current_function]){
                    
                    console.log(key, ":");
                    // console.log( this.cfg_nodes[this.current_function_stack][key]);
                    console.log("parents[");
                    var num_parents = this.cfg_nodes[current_class][current_function][key].parents.length;
                    for (var i=0; i< num_parents; i++)
                        console.log(this.cfg_nodes[current_class][current_function][key].parents[i]);
                        // console.log(this.cfg_nodes[this.current_function_stack][key].parents);
                        console.log("]");
                    console.log("left:", this.cfg_nodes[current_class][current_function][key].left);
                    console.log("right:", this.cfg_nodes[current_class][current_function][key].right);
                }
                console.log("------------------------------------\n");
            }
        }
    }

    

    // connect the last visited node to the end of the embedding block/loop/if.
    // If the leaf is a jump node, the parameter should be the node to jump to.
    // For example - connect the leaf of the tne branch to the dummy end node of the ip statement.
    connectPathLeafToNode(after_if_node_key, connect_jump)
    {
        var stack_len = this.node_stack[this.current_class][this.current_function].length;  
        var leaf_key = this.node_stack[this.current_class][this.current_function][stack_len - 1]; // the leaf of the (then/if) branch or last visited node.       
        var leaf_node = this.cfg_nodes[this.current_class][this.current_function][leaf_key];
        if (!this.isBranchingNode(leaf_node)){    
            this.cfg_nodes[this.current_class][this.current_function][leaf_key].left = after_if_node_key;
            this.cfg_nodes[this.current_class][this.current_function][after_if_node_key].parents.push(leaf_key);
        }
    }
 
    visitForStatement(node){
        if (this.init){
            var init_for_key = this.addToCFG(node.init);
            this.connectPathLeafToNode(init_for_key);
            this.node_stack[this.current_class][this.current_function].push(init_for_key);  // connect the init node to the node before the for
        }
        var for_key = this.addToCFG(node);
        this.connectPathLeafToNode(for_key); // connect the for node as child of the init
        cfg_nodes[this.current_class][this.current_function][for_key].test = node.test;
        var end_loop_key = this.createEndBlockNode("EndLoopNode", node);
        this.loop_stack[this.current_class][this.current_function].push(node_str);  // push the loop head to the loop stack
        this.loop_switch_end_stack[this.current_class][this.current_function].push(end_loop_key);
        this.visit(node.body);
        if (this.update){
            var update_for_key = this.addToCFG(node.update);
            this.connectPathLeafToNode(update_for_key, true);// connect only if leaf is not jump
            this.node_stack[this.current_class][this.current_function].push(update_for_key);
        }
        this.afterLoop(end_loop_key);
    }

    visitIteratedForLoop(node){
        var for_key = this.addToCFG(node);
        cfg_nodes[this.current_class][this.current_function][for_key].parser_left = node.left;
        cfg_nodes[this.current_class][this.current_function][for_key].parser_right = node.right;
        var end_loop_key = this.createEndBlockNode("EndLoopNode", node);
        this.loop_stack[this.current_class][this.current_function].push(node_str);  // push the loop head to the loop stack
        this.loop_switch_end_stack[this.current_class][this.current_function].push(end_loop_key);
        this.visit(node.body);
        this.afterLoop(end_loop_key);
    }

    visitForInStatement(node){
        visitIteratedForLoop(node);
    }

    visitForOfStatement(node){
        visitIteratedForLoop(node);
    }

    processFunctionDeclaration(node, dummy_function){
       
        var function_name = null;
        if (!dummy_function)
            function_name = node.id.name;
        if (function_name == null){
            function_name = createFunctionName();           
        }
        this.cfg_nodes[this.current_class][function_name] = {};
        this.current_function = function_name;
        this.initMethodStructures(this.current_class, function_name);
        this.current_function_stack[this.current_class].push(function_name);       
        // if (!(this.current_function_stack == GLOBAL_METHOD))
        //     this.addToCFG(node);   
        var key = this.addToCFG(node);
        this.node_stack[this.current_class][this.current_function].push(key);
        this.visit(node.body);
        this.popUntilNode(key);
        this.node_stack[this.current_class][this.current_function].pop();
        this.deleteMethodStructures(this.current_class, this.current_function); // going out of this method
        this.current_function_stack[this.current_class].pop();     
        var stack_len = this.current_function_stack[this.current_class].length;
        this.current_function = this.current_function_stack[this.current_class][stack_len-1];
        
    }

    // To get the parameters of a method - this.cfg_nodes[method_id].parser_node.parameters
    visitFunctionDeclaration(node){
        this.processFunctionDeclaration(node);
    }

    visitDefaultNode(node){
        var key = this.addToCFG(node);
        this.node_stack[this.current_class][this.current_function].push(key);
    }

    visitIfStatement(node){
        console.log("visit IfStatement");
        this.addToCFG(node);  
        var node_str = this.nodeStr(node);
        this.node_stack[this.current_class][this.current_function].push(node_str);  
        var after_if_node_key = this.createEndBlockNode("IfEndBlock", node);
        this.cfg_nodes[this.current_class][this.current_function][node_str].left = this.nodeStr(node.consequent);
        this.cfg_nodes[this.current_class][this.current_function][node_str].test = node.test;

        this.visit(node.consequent);  // dfs
        this.connectPathLeafToNode(after_if_node_key);
        this.popUntilNode(node_str);
        if (node.alternate) {  // else branch
            this.cfg_nodes[this.current_class][this.current_function][node_str].right = this.nodeStr(node.alternate);
            this.visit(node.alternate);
            this.connectPathLeafToNode(after_if_node_key);
            this.popUntilNode(node_str);
        }
        this.node_stack[this.current_class][this.current_function].pop();  // pop the if statement
        this.node_stack[this.current_class][this.current_function].push(after_if_node_key);   // push the dummy end block  
    }


    // label: statement
    visitLabeledStatement(node){
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
        var last_key = this.node_stack[this.current_class][this.current_function][function_stack_len - 1];
        var last_node = this.cfg_nodes[this.current_class][this.current_function][last_key];       
        while (!this.isBranchingNode(last_node.parser_node)){
            this.node_stack[this.current_class][this.current_function].pop();
            function_stack_len = this.node_stack[this.current_class][this.current_function].length;
            last_key = this.node_stack[this.current_class][this.current_function][function_stack_len - 1];
            last_node = this.cfg_nodes[this.current_class][this.current_function][last_key]; 
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
        this.popNonBranchingAncestors() // should pop ancestors until if/loop
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
        this.connectPathLeafToNode(end_block_key, false); // don't connect jump nodes to end block. They are treated 
        // in the jump statement.
        this.node_stack[this.current_class][this.current_function].push(end_block_key);
    }

    // Add the loop head to the cfg. Create a dummy node for after the loop and push it to the end nodes stack.
    beforeLoop(node){
        this.addToCFG(node);
        this.node_stack[this.current_class][this.current_function].push(node_str);
        var node_str = this.nodeStr(node); 
        this.cfg_nodes[this.current_class][this.current_function][node_str].test = node.test;
        var end_loop_key = this.createEndBlockNode("EndLoopNode", node);
        this.loop_stack[this.current_class][this.current_function].push(node_str);
        this.loop_switch_end_stack[this.current_class][this.current_function].push(end_loop_key);
        return end_loop_key;
    }

    afterLoop(end_loop_key){
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

    visitSwitchStatement(node){
        this.addToCFG(node);  
        var node_str = this.nodeStr(node);
        this.switch_head_stack[this.current_class][this.current_function].push(node_str);
        this.node_stack[this.current_class][this.current_function].push(node_str);  
        var after_switch_node_key = this.createEndBlockNode("SwitchEndBlock", node);
        this.loop_switch_end_stack[this.current_class][this.current_function].push(after_switch_node_key);
        for (var c in node.cases){
            this.visit(node.cases[c]);
        }
        this.popUntilNode(node_str);  
        this.switch_head_stack[this.current_class][this.current_function].pop();   // pop the switchstatement node
        this.node_stack[this.current_class][this.current_function].pop();  // pop the switchstatement node
        this.loop_switch_end_stack[class_name][function_name].pop(); // pop the switch end from the stack for break
        delete this.default_case[class_name][function_name][node_str]; // delete the default node of this switch
        
        this.node_stack[this.current_class][this.current_function].push(after_switch_node_key);   // push the dummy end block 
    }

    visitSwitchCase(node){
        this.addToCFG(node); 
        
        var node_str = this.nodeStr(node);
        this.node_stack[this.current_class][this.current_function].push(node_str);
        var default_case = this.isDefaultCase(node);
        if (default_case){
            var stack_len = this.switch_head_stack[this.current_class][this.current_function].length;
            var switch_head = this.switch_head_stack[this.current_class][this.current_function][stack_len - 1];
            this.default_case[this.current_class][this.current_function][switch_head] = node_str;           
        }
        else{
        // connect the node as "else" of the before last case
            var last_case_len = this.last_case[this.current_class][this.current_function].length;
            if (last_case_len > 0){
                // pop the last case of the current function in order to update it later to node_str.
                var last_case = this.last_case[this.current_class][this.current_function].pop();
                this.cfg_nodes[this.current_class][this.current_function][node_str].parents.push(last_case);
                this.cfg_nodes[this.current_class][this.current_function][last_case].right = node_str;
            }
        }
        // var after_case_node_key = this.createEndBlockNode("CaseEndBlock");
        for (var st in node.consequent){
            this.visit(node.consequent[st]);
        }
        // this.connectPathLeafToNode(after_case_node_key, false); // for the case the case block does not end with break.
        // this.popUntilNode(node_str);
        // this.node_stack[this.current_class][this.current_function].pop(); // pop the case node
        // this.node_stack[this.current_class][this.current_function].push(after_case_node_key);   // push the dummy end block 
        // update last case stacks         
        this.node_stack[this.current_class][this.current_function].pop();  // pop the case node
        if (!default_case)
            this.last_case[this.current_class][this.current_function].push(node_str);  
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
        if (class_name == null){
            class_name = createClassName();           
        }
        this.current_class_stack.push(class_name);
        this.current_class = this.current_class_stack[this.current_class_stack.length - 1];
        this.initClassStructures(class_name);
        this.visit(node.body);
        this.deleteClassStructures(class_name);
    }

    visitClassDeclaration(node){
        this.processClassDeclaration();
    }

    visitClassExpression(node){
        this.processClassDeclaration();
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
    visitMethodDefinition(node){
        this.visitExpression(node.key);
        this.visit(node.value);
    }

    //////////////////////////////////////////////////////////
    // Expression visitor
    //////////////////////////////////////////////////////////
    createFunctionName(){
        var function_name = "DUMMY_FUNCTION" + this.current_function_stack_id;
        this.current_function_stack_id++;
        return function_name;
    }

    visitFunctionExpression(node){
        this.processFunctionDeclaration(node);
    }

    visitExpressionStatement(node){
            this.visitDefaultNode(node);
            this.visitExpression(node.expression);
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
        this.visit(node.block);
        this.catch_clauses[this.current_class][this.current_function][key] = this.nodeStr(node.handler);
        this.visit(node.handler); // new functions for catch clauses
        this.visit(node.finalizer)
    }


    // Create a new function and process the catch clause as a function.
    visitCatchClause(node){
        this.processFunctionDeclaration(node, true);
    }
   
};