const { ESLintUtils } = require('@typescript-eslint/utils');

const createRule = ESLintUtils.RuleCreator.withoutDocs;

const enforceStandardResponse = createRule({
  name: 'enforce-standard-response',
  meta: {
    type: 'problem',
    docs: {
      description: 'Ensures res.json() arguments contain success, data, and message keys.',
    },
    messages: {
      missingProperties: 'The object passed to res.json() is missing required properties: {{missing}}.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    function findObjectLiteral(node) {
      if (!node) return null;
      if (node.type === 'ObjectExpression') return node;
      if (node.type === 'CallExpression' && node.arguments.length > 0) {
        return findObjectLiteral(node.arguments[0]); // Drill into the first arg
      }
      return null;
    }

    return {
      'CallExpression[callee.property.name="json"]'(node) {
        const targetObject = findObjectLiteral(node.arguments[0]);

        if (targetObject) {
          const propertyNames = targetObject.properties
            .filter((p) => p.type === 'Property' && p.key.type === 'Identifier')
            .map((p) => p.key.name);

          const required = ['success', 'data', 'message'];
          const missing = required.filter((key) => !propertyNames.includes(key));

          if (missing.length > 0) {
            context.report({
              node: targetObject, // This puts the squiggly line on the object literal
              messageId: 'missingProperties',
              data: { missing: missing.join(', ') },
            });
          }
        }
      },
    };
  },
});

const standardResponsePlugin = {
  meta: { name: 'local', version: '1.0.0' },
  rules: { 'enforce-standard-response': enforceStandardResponse },
};

module.exports = standardResponsePlugin;
