var esprima = require('esprima');

module.exports = class GlobalTransformer {
    constructor() {
        this.env = [];
        this.blocks = [];
    }

    get found_method() { return this._found_method; }

    visit(node) {
        if (node === null) {
            return;
        }
        switch (node.type) {
            case "ArrayPattern":
                this.visit_array_pattern(node);
                break;
            case "RestElement":
                this.visit_rest_element(node);
                break;
            case "AssignmentPattern":
                this.visit_assignment_pattern(node);
                break;
            case "ObjectPattern":
                this.visit_object_pattern(node);
                break;
            case "Property":
                this.visit_property(node);
                break;
            case "ThisExpression":
                break;
            case "Identifier":
                this.visit_identifier(node);
                break;
            case "Literal":
                break;
            case "ArrayExpression":
                this.visit_array_expression(node);
                break;
            case "ObjectExpression":
                this.visit_object_expression(node);
                break;
            case "FunctionExpression":
                this.visit_function_expression(node);
                break;
            case "ArrowFunctionExpression":
                this.visit_arrow_function_expression(node);
                break;
            case "ClassExpression":
                this.visit_class_expression(node);
                break;
            case "ClassBody":
                this.visit_class_body(node);
                break;
            case "MethodDefinition":
                this.visit_method_definition(node);
                break;
            case "TaggedTemplateExpression":
                //this.visit_tagged_template_expression(node);
                break;
            case "TemplateElement":
                //this.visit_template_element(node);
                break;
            case "TemplateLiteral":
                //this.visit_template_literal(node);
                break;
            case "MemberExpression":
                this.visit_member_expression(node);
                break;
            case "Super":
                break;
            case "MetaProperty":
                break;
            case "CallExpression":
                this.visit_call_expression(node);
                break;
            case "NewExpression":
                this.visit_new_expression(node);
                break;
            case "SpreadElement":
                this.visit_spread_element(node);
                break;
            case "UpdateExpression":
                this.visit_update_expression(node);
                break;
            case "AwaitExpression":
                this.visit_await_expression(node);
                break;
            case "UnaryExpression":
                this.visit_unary_expression(node);
                break;
            case "BinaryExpression":
                this.visit_binary_expression(node);
                break;
            case "LogicalExpression":
                this.visit_logical_expression(node);
                break;
            case "ConditionalExpression":
                this.visit_conditional_expression(node);
                break;
            case "YieldExpression":
                this.visit_yield_expression(node);
                break;
            case "AssignmentExpression":
                this.visit_assignment_expression(node);
                break;
            case "SequenceExpression":
                this.visit_sequence_expression(node);
                break;
            case "BlockStatement":
                this.visit_block_statement(node);
                break;
            case "BreakStatement":
                break;
            case "ClassDeclaration":
                this.visit_class_declaration(node);
                break;
            case "ContinueStatement":
                break;
            case "DebuggerStatement":

                break;
            case "DoWhileStatement":
                this.visit_do_while_statement(node);
                break;
            case "EmptyStatement":
                break;
            case "ExpressionStatement":
                this.visit_expression_statement(node);
                break;
            case "ForStatement":
                this.visit_for_statement(node);
                break;
            case "ForInStatement":
                this.visit_for_in_statement(node);
                break;
            case "ForOfStatement":
                this.visit_for_of_statement(node);
                break;
            case "FunctionDeclaration":
                this.visit_function_declaration(node);
                break;
            case "IfStatement":
                this.visit_if_statement(node);
                break;
            case "LabeledStatement":
                this.visit_labeled_statement(node);
                break;
            case "ReturnStatement":
                this.visit_return_statement(node);
                break;
            case "SwitchStatement":
                this.visit_switch_statement(node);
                break;
            case "SwitchCase":
                this.visit_switch_case(node);
                break;
            case "ThrowStatement":
                this.visit_throw_statement(node);
                break;
            case "TryStatement":
                this.visit_try_statement(node);
                break;
            case "CatchClause":
                this.visit_catch_clause(node);
                break;
            case "VariableDeclaration":
                this.visit_variable_declaration(node);
                break;
            case "VariableDeclarator":
                this.visit_variable_declarator(node);
                break;
            case "WhileStatement":
                this.visit_while_statement(node);
                break;
            case "WithStatement":
                this.visit_with_statement(node);
                break;
            case "Program":
                this.visit_program(node);
                break;
            case "ImportDeclaration":
                this.visit_import_declaration(node);
                break;
            case "ImportSpecifier":
                this.visit_import_specifier(node);
                break;
            case "ImportDefaultSpecifier":
                break;
            case "ImportNamespaceSpecifier":
                break;
            case "ExportAllDeclaration":

                break;
            case "ExportDefaultDeclaration":
                this.visit_export_default_declaration(node);
                break;
            case "ExportNamedDeclaration":
                this.visit_export_named_declaration(node);
                break;
            case "ExportSpecifier":
                break;


            default:
                throw new Error(node.type + " is unsupported");
        }
    }

    create_env() {
        this.env.push(new Map());
    }

    remove_env() {
        this.env.pop();
    }



    visit_program(node) {
        for (var i = 0; i < node.body.length; i++) {
            this.visit(node.body[i]);
        }
    }

    visit_array_pattern(node) {
        for (var i = 0; i < node.elements.length; i++) {
            this.visit(node.elements[i]);
        }
    }

    visit_rest_element(node) {
        this.visit(node.argument);
    }

    visit_assignment_pattern(node) {
        this.visit(node.left);
        this.visit(node.right);
    }

    visit_object_pattern(node) {
        for (var i = 0; i < node.properties.length; i++) {
            this.visit_property(node.properties[i]);
        }
    }

    visit_property(node) {
        this.visit(node.key);
        this.visit(node.value);
    }

    visit_identifier(node) {
        
    }

    visit_array_expression(node) {
        for (var i = 0; i < node.elements; i++) {
            this.visit(node.elements[i]);
        }
    }

    visit_object_expression(node) {
        for (var i = 0; i < node.properties.length; i++) {
            this.visit_property(node.properties[i]);
        }
    }
    add_param_to_env(param) {
        switch (param.type) {
            case "Identifier":
                this.env[this.env.length - 1].set(param.name, null);
                break;
            case "AssignmentPattern":
                if (param.left.type == "Identifier") {
                    this.env[this.env.length - 1].set(param.left.name, null);
                }
                break;
        }
    }

    visit_function_expression(node) {
        this.create_env()
        this.visit(node.id);
        for (var i = 0; i < node.params.length; i++) {
            var param = node.params[i];
            this.add_param_to_env(param);
            this.visit(param);
        }
        this.visit(node.body);
        this.remove_env();
    }


    visit_arrow_function_expression(node) {
        this.create_env();
        this.visit(node.id);
        for (var i = 0; i < node.params.length; i++) {
            var param = node.params[i];
            this.add_param_to_env(param);
            this.visit(param);
        }
        this.visit(node.body);
        this.remove_env();
    }

    visit_class_expression(node) {
        this.visit(node.id);
        this.visit(node.superClass);
        this.visit(node.body);

    }

    visit_class_body(node) {
        for (var i = 0; i < node.body.length; i++) {
            this.visit(node.body[i]);
        }
    }

    visit_method_definition(node) {
        this.visit(node.key);
        this.visit(node.value);
    }

    visit_tagged_template_expression(node) {
        throw new Error(node);
    }
    visit_template_element(node) {
        throw new Error(node);
    }
    visit_template_literal(node) {
        throw new Error(node);
    }
    visit_member_expression(node) {
        this.visit(node.object);
        this.visit(node.property);
    }
    visit_call_expression(node) {
        this.visit(node.callee);
        for (var i = 0; i < node.arguments.length; i++) {
            this.visit(node.arguments[i]);
        }

    }
    visit_new_expression(node) {
        this.visit(node.callee);
        for (var i = 0; i < node.arguments.length; i++) {
            this.visit(node.arguments[i]);
        }
    }
    visit_spread_element(node) {
        this.visit(node.argument);
    }
    visit_update_expression(node) {
        this.visit(node.argument);
    }
    visit_await_expression(node) {
        this.visit(node.argument);
    }
    visit_unary_expression(node) {
        this.visit(node.argument);
    }
    visit_binary_expression(node) {
        this.visit(node.left);
        this.visit(node.right);
    }
    visit_logical_expression(node) {
        this.visit(node.left);
        this.visit(node.right);
    }
    visit_conditional_expression(node) {
        this.visit(node.test);
        this.visit(node.consequent);
        this.visit(node.alternate);
    }
    visit_yield_expression(node) {
        this.visit(node.argument);
    }
    visit_assignment_expression(node) {
        this.visit(node.left);
        this.visit(node.right);
    }

    visit_sequence_expression(node) {
        for (var i = 0; i < node.expressions.length; i++) {
            this.visit(node.expressions[i]);

        }
    }
    create_block() {
        this.blocks.push([]);
    }

    remove_block() {
        return this.blocks.pop();
    }

    add_stmt_to_block(stmt) {
        if (this.blocks.length > 0) {
            this.blocks[this.blocks.length - 1].push(stmt);
        }
    }

    visit_block_statement(node) {
        this.create_block();
        for (var i = 0; i < node.body.length; i++) {
            this.add_stmt_to_block(node.body[i]);
            this.visit(node.body[i]);
        }
        var stmts = this.remove_block();
        node.body = stmts;
    }

    visit_class_declaration(node) {
        this.visit(node.id);
        this.visit(node.superClass);
        this.visit(node.body);

    }

    assert_block_body(node) {
        if (node.body.type !== "BlockStatement") {
            node.body = new esprima.Nodes.BlockStatement([node.body]);
        }
    }

    visit_do_while_statement(node) {
        this.visit(node.test);
        this.assert_block_body(node);
        this.visit(node.body);
    }

    visit_for_statement(node) {
        this.visit(node.init);
        this.visit(node.test);
        this.visit(node.update);
        this.assert_block_body(node);
        this.visit(node.body);
    }
    visit_for_in_statement(node) {
        this.visit(node.left);

        this.visit(node.right);
        this.assert_block_body(node);
        this.visit(node.body);
    }
    visit_for_of_statement(node) {
        this.visit(node.left);

        this.visit(node.right);
        this.assert_block_body(node);
        this.visit(node.body);
    }
    visit_function_declaration(node) {
        this.create_env();
        this.visit(node.id);
        for (var i = 0; i < node.params.length; i++) {
            var param = node.params[i];
            this.add_param_to_env(param);
            this.visit(param);
        }
        this.visit(node.body);
        this.remove_env()
    }
    visit_if_statement(node) {
        this.visit(node.test);
        if (node.consequent.type !== "BlockStatement") {
            node.consequent = new esprima.Nodes.BlockStatement([node.consequent]);
        }
        this.visit(node.consequent);
        if (node.alternate) {
            if (node.alternate.type !== "BlockStatement") {
                node.alternate = new esprima.Nodes.BlockStatement([node.alternate]);
            }
            this.visit(node.alternate);
        }
    }
    visit_labeled_statement(node) {
        this.visit(node.body);
    }
    visit_return_statement(node) {
        this.visit(node.argument);
    }
    visit_switch_statement(node) {
        this.visit(node.discriminant);
        for (var i = 0; i < node.cases.length; i++) {
            this.visit(node.cases[i])
        }
    }
    visit_switch_case(node) {
        this.create_block();
        this.visit(node.test);
        for (var i = 0; i < node.consequent.length; i++) {
            this.add_stmt_to_block(node.consequent[i]);
            this.visit(node.consequent[i])
        }
        this.consequent = this.remove_block();
    }

    visit_throw_statement(node) {
        this.visit(node.argument);
    }
    visit_try_statement(node) {
        this.visit(node.block);
        this.visit(node.handler);
        this.visit(node.finalizer);
    }
    visit_catch_clause(node) {
        this.visit(node.param);

        this.visit(node.body);
    }
    visit_variable_declaration(node) {
        for (var i = 0; i < node.declarations.length; i++) {
            this.visit(node.declarations[i]);
        }
    }

    generate_name(){
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

        for (var i = 0; i < 15; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }

    add_map_to_env(new_name, name) {
        if (this.env.length > 0) {
            this.env[this.env.length - 1].set(name, new_name);
        }
    }

    visit_variable_declarator(node) {
        this.visit(node.id);
        this.visit(node.init);

        if (node.id.type === "Identifier") {
            var name = this.generate_name();
            this.add_map_to_env(name, node.id.name);
            this.add_stmt_to_block(this.create_var_assign(name, node.id.name));
        } 
    }

    visit_while_statement(node) {
        this.visit(node.test);
        this.assert_block_body(node);
        this.visit(node.body);
    }
    visit_with_statement(node) {
        this.visit(node.object);
        this.assert_block_body(node);
        this.visit(node.body);
    }
    visit_import_declaration(node) {
        for (var i = 0; i < node.specifiers.length; i++) {
            this.visit(node.specifiers[i]);
        }
    }
    visit_import_specifier(node) {

    }
    visit_export_default_declaration(node) {
        this.visit(node.declaration);
    }
    visit_export_named_declaration(node) {
        this.visit(node.declaration);
    }

    lookup_var(name) {
        for (var i = this.env.length - 1; i >= 0; i--) {
            if (this.env[i].has(name)) {
                return this.env[i].get(name);
            }
        }
    }
    create_var_assign(target, source) {
        return new esprima.Nodes.ExpressionStatement(
            new esprima.Nodes.AssignmentExpression(
                "=",
                new esprima.Nodes.StaticMemberExpression(new esprima.Nodes.Identifier("window"),new esprima.Nodes.Identifier(target)),
                new esprima.Nodes.Identifier(source)
            ));
    }

    visit_expression_statement(node) {
        if (node.expression.type === "AssignmentExpression") {
            if (node.expression.left.type === "Identifier") {
                var id = node.expression.left.name;
                var map_name = this.lookup_var(id);
                if (map_name !== undefined && map_name !== null) {
                    this.add_stmt_to_block(this.create_var_assign(map_name, id));
                }
            }
        }
    }
}
