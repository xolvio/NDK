function generateCode(schema: unknown): string {
  return `${schema}`;
}

describe('generate code', () => {
  describe('from schema', () => {
    it('should create the scaffold', async () => {
      const schema = {
        description: 'increase credit limit',
        frames: [
          {
            interactions: [],
            moment: {
              name: 'Existing user requests to increase credit limit',
            },
            actions: [
              {
                name: 'Increase credit limit',
                // subscripts are basically a sequence diagram with one or more lanes
                subscript: [
                  {
                    laneName: 'xyz',
                    frames: ['$ref:increase-credit-limit', '$ref:credit-account', '$ref:credit-limit-increased'],
                    specs: ['$ref:credit-account-specs:1'], // note how we're only referencing one rule in the spec
                  },
                ],
              },
            ],
          },
        ],
        constructs: {
          'increase-credit-limit': {
            type: 'command',
            params: {
              amount: 'string',
            },
            meta: {
              produces: ['$ref:credit-limit-increased', '$ref:submitted-for-underwriting'],
              strategy: 'LOAD', // this tells the command handler to load the existing aggregate
            },
          },
          'credit-limit-increased': {
            type: 'event',
            params: {
              amount: 'string',
            },
          },
          'submitted-for-underwriting': {
            type: 'event',
            params: {},
          },
          'credit-account': {
            type: 'aggregate',
            spec: '$ref:credit-account-specs',
          },
        },
        specs: {
          'credit-account-specs': {
            rules: [
              {
                id: '1',
                text: `
                  Rule: Customers that have been with us for a year can increase their credit limit by 1000 automatically
                    Example:
                      Given the user had a credit account for 1 year
                      When the credit limit is increased 1000
                      Then the credit limit increased to 1000
                      And the request is not submitted for underwriting
                `,
              },
              {
                id: '2',
                text: `
                  Rule: Customers that have been with us for a year can increase their credit limit by 1000 automatically
                    Example:
                      Given the user had a credit account for 1 year
                      When the credit limit is increased 1000
                      Then the credit limit increased to 1000
                      And the request is not submitted for underwriting
                `,
              },
              {
                id: '3',
                text: `
                  Rule: New customers cannot increase their credit limit
                    Example:
                      Given the user had a credit account for 1 month
                      When the credit limit is increased 1000
                      Then the credit limit is not increased
                      And the request is not submitted for underwriting
                `,
              },
            ],
          },
        },
      };

      const code = generateCode(schema);

      expect(code).toBe(`
        // PURE CODE GENERATION (see convertMessages)
        // increase-credit-limit-command.ts
        class IncreaseCreditLimitCommand extends DDK.Command{
          public constructor(public readonly amount: string) {}
        }
        
        // PURE CODE GENERATION (see convertMessages)
        // credit-limit-increased-event.ts
        class CreditLimitIncreasedEvent extends DDK.Event {
          public constructor(public readonly amount: string) {}
        }
       
       // PLACEHOLDER CODE GENERATION - LLM IMPLEMENTATION - (see generateAggregateFiles)
       // credit-account-aggregate.ts
        class CreditAccountAggregate extends DDk.AggregateRoot {
          // LLM WORKS HERE - this is where any fields that are needed 
          public increaseCreditLimit(command: IncreaseCreditLimitCommand) { // how many events get produced here?
            // LLM WORKS HERE
          }
          public applyCreditLimitIncreased(event: CreditLimitIncreasedEvent) {
            // LLM WORKS HERE - (see implementAggregate)
          }
        }
        
        // PURE CODE GENERATION (see generateCommandHandlers)
        // credit-account-handler.ts
        class CreditAccountHandler {
          
          // the app will inject the repository. The repository is identified for all aggregates, see the DDK
          constructor(private readonly repository) {}
          
          public increaseCreditLimit(command: IncreaseCreditLimitCommand) {
            const instance = await this.CreditAccountRepository.getById(command.id);
            instance.increaseCreditLimit(command);
            await this.CreditAccountRepository.save(instance);
          }
        }
        
        // TESTING FRAMEWORK
        // Let's try to make this deterministic, otherwise we can use LLMs here as well. Maybe it's a combination
        
        // world.ts - (see templates/hooks.ts)
        // set up the message bus
        
        // step-definitions.ts - (see generateSteps)
        Given('the user had a credit account for 1 year', () => {
          // placeholder for the actual implementation for the LLM
          fixtures.addEvent(new UserAccountInitializedEvent(created: new Date('2020-01-01'));
        });
        
        When('the credit limit is increased', () => {
          // placeholder for the actual implementation for the LLM
          messageBus.publish(new IncreaseCreditLimitCommand(amount: '1000'));
        });
        
        Then('the credit limit increased to 1000', () => {
          // placeholder for the actual implementation for the LLM
          const event = eventStore.get().find(e => {
            return e instanceof CreditLimitIncreasedEvent && e.amount === '1000';
          });
          expect(numberOfEvents).toBe(fixtures.numberOfEvents + 1);
        });
        
        // iterate with compiler to see that it works
        // ensure test is failing
        
      `);
    });
  });
});
