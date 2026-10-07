---
org: Access Idaho (NIC, now Tyler Technologies)
role: Senior Software Engineer
location: Boise, Idaho
start: "2000"
order: 1
---
Since 2000 I've built and run Idaho's online government services: payments, billing and licensing handling money and sensitive personal data. In a small office, I own applications end to end and also take on security, audits, legacy retirement, and architecture planning with our Director of Development.

- **Built payment services that stay up.** I designed Scheduled Payments for recurring citizen payments and the final version of Subscriber Billing for monthly business invoicing. Both run on NIC's payment platform and have operated for about 15 years with no real downtime.
- **Retired a legacy platform without a big-bang rewrite.** Over about ten years, I moved each application off our original billing and app platform using the least risky path for it: rewrite onto NIC payments, handoff to the agency, or migration to NIC or Tyler low-code products. The last pieces retire by the end of 2026.
- **Built reactive licensing middleware for recoverable delivery.** I designed services connecting a Tyler low-code licensing product to an agency database of record. They use Micronaut and Spring Boot with Reactor, RxJava and RabbitMQ, with message handling designed to preserve work through service and broker failures. They were our first production use of both frameworks.
- **Automated infrastructure and deployment.** I automated production deploys from Jenkins and made CloudFormation the standard for new AWS environments, reducing sysadmin work. I'm now preparing applications for separate sandbox, test and production accounts, containers, and ElastiCache-backed load balancing.
- **Modernized application and database platforms.** I'm moving Grails applications from Grails 3 on Java 11 to Grails 5 on Java 17, and databases from Oracle to Aurora PostgreSQL; newer services run on Java 21. I also run PCI DSS security scans on production deployments and write audit documentation for outside approval.
- **Brought AI-assisted development into the office.** I made the case for developer experimentation, served as an early-access AI champion in Tyler's rollout, and wrote Claude Code conventions for our Grails stack and in-house plugins. I introduced Playwright and pushed us to use AI for tests and documentation that had long been deferred.
