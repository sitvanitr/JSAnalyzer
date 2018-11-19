

// todo:
// If an expression contains a statement

module.exports = class ASTVisitor{


    nodeStr(node){
        console.log("node=", node);
        var str = node.type + '-' + node.range[0] + '-' + node.range[1];
//       node["loc"]["start"]["line"] + '-' +
//       node.loc.start.column +
//              '-' + node.loc.end.line + '-' + node.loc.end.column;
        console.log("nodeStr ",str);
        return str;
    }



    visitFunctionExpression(node){
        visit(node.body);
    }

    visitArrowFunctionExpression(node){
        visit(node.body);
    }

    visitClassExpression(node){
        if (!(this.current_function == GLOBAL_FUNCTION))
            console.log("warning: class Expression inside a function not supported");
        visit(node.body);
    }

    visitClassDeclaration(node){
        console.log("visitClassDeclaration ", node);
        this.visit(node.body);
    }

    visitClassBody(node){
        console.log("visitClassBody ", node);
        for (var i = 0, list = node.body; i < list.length; i += 1)
            {
            var stmt = list[i];
            console.log(i, stmt);
            this.visit(stmt);
          }
    }

    visitBlockStatement(node){
        console.log("visitBlock ");
        for (var i = 0, list = node.body; i < list.length; i += 1)
            {
            var stmt = list[i];
            this.visit(stmt);
          }
    }

    visitBreakStatement(node){
    }

    visitContinueStatement(node){
    }

    visitDebuggerStatement(node){
    }

    visitDoWhileStatement(node){
        visit(node.body);
    }

    visitIfStatement(node){
        console.log("visit IfStatement", node);

    }

    visitLabeledStatement(node){
        this.visitDefaultNode(node);
    }

    skipThrough(node) {
    this.visit(node, st); }




//   visitMethodDefinition(node){
//        if (node.computed) { this.visit(node.key); }
//         this.visit(node.value);
//   }
 ignore(node) {}
//

    createIfStatementForLoop(node){
        var if_node = new OurASTNode(node.init, this.current_node);
    }

    visitForStatement(node) {
        var init_node = new OurASTNode(node.init, this.current_node);
        var if_node =  createIfStatementForLoop(node);
        if (node.update) { this.visit(node.update, st, "Expression"); }
      this.visit(node.body);
    };

    visitForInStatement_cb(node) {
      this.visit(node.left);
      this.visit(node.right, st, "Expression");
      this.visit(node.body, st, "Statement");
    };



    visitMethodDefinition(node) {
      if (node.computed) { visit(node.key); }
      this.visit(node.value);
    }

    visitFunctionExpression(node){
        console.log("visitFunctionExpression");
        this.visit(node.body);
    }



    visit(node){
        switch (node.type){
            case "FunctionExpression":
                this.visitFunctionExpression(node);
                break;
            case "ArrowFunctionExpression":
                this.visitArrowFunctionExpression(node);
                break;
            case "Program":
            case "BlockStatement":
                this.visitBlockStatement(node);
                break;
            case "IfStatement":
                this.visitIfStatement(node);
                break;
            case "ClassExpression":
                this.visitClassExpression(node);
                break;
            case "BreakStatement":
                this.visitBreakStatement(node);
                break;
            case "ContinueStatement":
                this.visitContinueStatement(node);
                break;
            case "DebuggerStatement":
                this.visitDebuggerStatement(node);
                break;
            case "DoWhileStatement":
                this.visitDoWhileStatement(node);
                break;
            case "EmptyStatement":
                this.visitEmptyStatement(node);
                this.visitEmptyStatement(node);
                break;
            case "ClassDeclaration":
                this.visitClassDeclaration(node);
                break;
            case "ClassExpression":
                this.visitClassExpression(node);
                break;
            case "ClassBody":
                this.visitClassBody(node);
                break;
            case "MethodDefinition":
                this.visitMethodDefinition(node);
                break;
            case "FunctionDeclaration":
                this.visitFunctionDeclaration(node);
                break;
            case "SwitchStatement":
                this.visitSwitchStatement(node);
                break;
            case "SwitchCase":
                this.visitSwitchCase(node);
                break;
            default:
                this.visitDefaultNode(node);
            

        }
    }

    visitExpression(node){
        switch (node.type){
            case "FunctionExpression":
            case "ArrowFunctionExpression":
                this.visitFunctionExpression(node);
                break;
            
            default:
                console.log("default", node);
                this.visitDefaultExpression(node);
        }
    }

    visitDefaultNode(node){
    }

    isIfNode(node){
        if (!node)
            return false;
        return (node.type == "IfStatement"); 
    }

    isBranchingNode(node)
    {
        console.log("isBranching ", node.type);
        if (!node)
            return false;
        return (node.type == "IfStatement" ||
            node.type == "WhileStatement" ||
            node.type == "DoWhileStatement" || node.type == "ForStatement" ||
            node.type == "ForInStatement"  || node.type == "ForOfStatement" || 
            node.type == "SwitchCase");
    }

    isJumpStatement(node){
        if (!node)
            return false;
        return ((node.type == "BreakStatement") || (node.type=="ContinueStatement") || 
        (node.type=="ReturnStatement") || (node.type == "ThrowStatement"));
    }

    isDefaultCase(node){
        if (!node)
            return false;
        return node.type =="SwitchCase" && node.test == null;
    }

};
