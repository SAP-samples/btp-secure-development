using { sap.capire.incidents as my } from '../db/schema';

service ProcessorService {
  @restrict: [
    { grant: ['READ', 'CREATE'], to: 'support' },
    { grant: ['UPDATE', 'DELETE'], 
      to: 'support',
      where: 'assignedTo is null or assignedTo = $user'
    },
    { grant: '*', to: 'admin' }
  ]
  entity Incidents as projection on my.Incidents;
  
  @readonly
  entity Customers as projection on my.Customers;
}

annotate ProcessorService.Incidents with @odata.draft.enabled; 
annotate ProcessorService with @(requires: ['support', 'admin']);

service AdminService {
  @restrict: { grant: '*', to: 'admin' }
  @odata
  
  entity Customers as projection on my.Customers;
  entity Incidents as projection on my.Incidents;

  // ✅ Add Custom Vulnerable Operation fetchCustomer to AdminService
  // ✅ Exposed via HTTP GET  {{server}}/odata/v4/admin/fetchCustomer with JSON body

  @tags: ['security', 'vulnerable']
  @summary: 'Returns customer data using various query construction methods (for security testing only)'
  
function fetchCustomer(
    customerID: String,
    /*
     * Query construction method:
     * 
     *   concat  → ❌ VULNERABLE: String interpolation
     *             `SELECT ... WHERE ID = '${customerID}'`
     *             Payload ' OR '1'='1 → returns all records!
     * 
     *   tagged  → ❌ VULNERABLE: Parenthesized template literal
     *             sql(`...${customerID}...`) evaluates before tag function
     *             Same injection risk as concat
     * 
     *   safe    → ✅ SECURE: Parameterized query
     *             SELECT.from('Customers').where({ID: customerID})
     *             Input automatically sanitized
     */
    method: String
  ) returns array of Customers;
}

annotate AdminService with @(requires: 'admin');
