const cds = require('@sap/cds');

class ProcessorService extends cds.ApplicationService {
  init() {
    // Expanded to handle CLOSE action (if implemented as a custom action)
    this.before(['UPDATE', 'DELETE'], 'Incidents', req => this.onModify(req));

    // Retain horizontal ESC fixes (auto-assignment, urgency handling)
    this.before("CREATE", "Incidents", req => this.onBeforeCreate(req));
    return super.init();
  }

  /** Helper: Adjust urgency based on title (unchanged) */
  changeUrgencyDueToSubject(data) {
    if (!data) return;
    const incidents = Array.isArray(data) ? data : [data];
    incidents.forEach(incident => {
      if (incident.title?.toLowerCase().includes("urgent")) {
        incident.urgency = { code: "H", descr: "High" };
      }
    });
  }

  // Enforce admin-only operations (vertical ESC)
  async onModify(req) {
    // Fetch current incident state (status + urgency)
    const result = await SELECT.one.from(req.subject)
      .columns('status_code', 'urgency_code')
      .where({ ID: req.data.ID });

    if (!result) return req.error(404, `Incident ${req.data.ID} not found`);

    // 1️⃣ Check if incident is already closed
    if (result.status_code === 'C') {
      if (!req.user.is('admin')) {
        const action = req.event === 'UPDATE' ? 'modify' : 'delete';
        return req.error(403, `Cannot ${action} a closed incident`);
      }
      return;
    }

    // 2️⃣ Check if user is attempting to close the incident (status_code set to 'C')
    if (req.data.status_code === 'C') {
      if (result.urgency_code === 'H' && !req.user.is('admin')) {
        return req.error(403, 'Only administrators can close high-urgency incidents');
      }
    }
  }

  // Retain auto-assignment logic (unchanged)
  async onBeforeCreate(req) {
    const incident = req.data;
    if (incident.status_code === 'A' && req.user) {
      incident.assignedTo = req.user.id;
      console.log(`📝 Auto-assigned incident to ${req.user.id}`);
    }
    this.changeUrgencyDueToSubject(incident);
  }
}
// AdminService Implementation
/**
 * AdminService Class
 * This service handles administrative operations, including fetching customer data.
 * It demonstrates different methods of constructing SQL queries, highlighting
 * both vulnerable and secure approaches.
 */
class AdminService extends cds.ApplicationService {
  /**
   * Initialize the service
   * Sets up event handlers for service operations
   */
  init() {
    /**
     * Event handler for the 'fetchCustomer' operation
     * This method demonstrates different approaches to constructing SQL queries
     * and handling the results.
     *
     * @param {Object} req - The request object containing customerID and method
     */
    this.on('fetchCustomer', async (req) => {
      // Extract customerID and method from the request data
      // Default to 'concat' method if not specified
      const { customerID, method = 'concat' } = req.data;

      /**
       * ❌ VULNERABILITY 1: Direct String concatenation method
       * This method directly interpolates user input into the SQL query,
       * creating a significant SQL injection vulnerability.
       */
      if (method === 'concat') {
        console.log('⚠️ Using INSECURE string concatenation method.');
        // ❌ CRITICAL: User input is directly embedded in SQL query
        // This allows for SQL injection attacks
        const query = `SELECT * FROM sap_capire_incidents_Customers WHERE ID = '${customerID}'`;

        try {
          // Execute the vulnerable query
          return await cds.run(query);
        } catch (error) {
          // Log the error and reject the request
          cds.log('security').error(`SQL error: ${error.message.substring(0, 100)}`);
          return req.reject(400, 'Invalid customer identifier');
        }
      }

      /**
       ❌ VULNERABILITY 2: Parenthesized tagged template method
       * This method is vulnerable because parentheses cause immediate evaluation
       * of the template, similar to string concatenation.
       */
      if (method === 'tagged') {
        console.log('⚠️ Using INSECURE parenthesized tagged template method.');

        /**
         * Tagged template function for SQL query construction
         * This function is designed to prevent SQL injection, but parentheses
         * cause immediate evaluation, defeating its purpose.
         *
         * @param {Array<string>} strings - Array of string literals from the template
         * @param {...any} values - Array of values to be substituted into the template
         * @returns {string} The constructed SQL query
         */
        const sql = (strings, ...values) => {
          console.log('Received strings:', strings);
          console.log('Received values:', values);

          // ❌ DETECT: Parentheses used - strings is already a plain string!
          // This indicates that the template was evaluated before reaching this function
          if (typeof strings === 'string') {
            console.log('❌ PARENTHESES DETECTED: strings is plain string, not array!');
            // ❌ CRITICAL: Returning the already-interpolated string directly
            // This makes the query vulnerable to SQL injection
            return strings;
          }
        };

        // ❌ CRITICAL: PARENTHESES cause immediate evaluation!
        // The template is evaluated before reaching the sql function
        // This creates a vulnerable query string
        const vulnerableQuery =
          sql(`SELECT * FROM sap_capire_incidents_Customers WHERE ID = '${customerID}'`);

        console.log('❌ Vulnerable query constructed:', vulnerableQuery);

        try {
          // Execute the vulnerable query
          const results = await cds.run(vulnerableQuery);
          console.log('✅ Results count:', results.length);
          return results;
        } catch (error) {
          console.error('❌ Error:', error.message);
          // Log the error and reject the request
          cds.log('security').error(`SQL error: ${error.message.substring(0, 100)}`);
          return req.error(400, 'Invalid customer identifier');
        }
      }

      /**
       * SECURE: Parameterized query method
       * This method uses CAP's fluent API to create a parameterized query
       * which automatically sanitizes user input and prevents SQL injection.
       */
      if (method === 'safe') {
        console.log('✅ Using SECURE parameterized query method.');

        try {
          // ✅ SECURE: Parameterized query using CAP's fluent API
          // This approach automatically sanitizes input and prevents SQL injection
          // Use the CDS entity name, not the DB table name/full path
          const query = SELECT.from('Customers').where({ ID: customerID });
          const results = await cds.run(query);
          return results;
        } catch (error) {
          // Log the error and reject the request
          cds.log('security').error(`SQL error: ${error.message.substring(0, 100)}`);
          return req.error(400, 'Invalid customer identifier');
        }
      }

      // Handle unknown methods
      // If an unknown method is provided, return an error
      return req.error(400, `Unknown method: ${method}`);
    });
  }
}

module.exports = { ProcessorService, AdminService};
