// response-check-rule.js
const { ESLintUtils } = require('@typescript-eslint/utils');

const createRule = ESLintUtils.RuleCreator.withoutDocs;

module.exports = createRule({
  name: 'enforce-standard-response',
  meta: {
    type: 'problem',
    docs: { description: 'Ensures res.json() receives a standard response object.' },
    messages: {
      invalidResponse: 'The response passed to res.json() does not conform to the standard structure (success, data, message).',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    // 1. Get the TypeScript Type Checker
    const services = ESLintUtils.getParserServices(context);
    const checker = services.program.getTypeChecker();

    return {
      'CallExpression[callee.property.name="json"]'(node) {
        const responseArg = node.arguments[0];
        if (!responseArg) return;

        // 2. Get the Type of the argument (e.g., the return type of ApiResponse)
        const tsNode = services.esTreeNodeToTSNodeMap.get(responseArg);
        const type = checker.getTypeAtLocation(tsNode);

        // 3. Check for the required properties in the type
        const required = ['success', 'data', 'message'];
        const properties = type.getProperties().map((p) => p.getName());

        const missing = required.filter((key) => !properties.includes(key));

        if (missing.length > 0) {
          context.report({
            node: responseArg,
            messageId: 'invalidResponse',
          });
        }
      },
    };
  },
});
