---
org: Access Idaho (NIC, now Tyler Technologies)
role: Senior Software Engineer
location: Boise, Idaho
start: "2000"
order: 1
---
Since 2000 I've built and run Idaho's online government services: payments, billing and licensing for state agencies and local departments, all of it handling money and sensitive personal data. It's a small office, so each developer owns their apps end to end. I've taken on more than mine: security, audits, retiring old systems, and planning architecture with our Director of Development.

- **Retired our original platform, one app at a time.** We started in 2000 with our own billing system and an app suite on one large server, because NIC had no central billing yet. I first turned our billing into a front for NIC's, then spent about ten years moving each app off by whichever route fit it: a rewrite onto NIC payments, a handover to the agency, or a move to NIC or Tyler low-code products. The last pieces retire by the end of 2026.
- **Payment services that stay up.** I designed and built Scheduled Payments, which lets agencies offer citizens recurring payments for taxes and balances owed. I built the final version of Subscriber Billing, which invoices businesses monthly for their filings. Both sit on NIC's payment platform, and both have run about 15 years with no real downtime.
- **Licensing middleware, reactive and resilient.** I designed and built the services that connect a Tyler low-code licensing product to an agency's database of record. They're Micronaut and Spring Boot, with Reactor, RxJava and RabbitMQ, built to lose no message in any failure mode. They were our first production use of both frameworks, after years of my evaluating them.
- **Infrastructure as code, and fewer hands on servers.** I automated our production deploys from Jenkins and made CloudFormation the rule for every new AWS environment, which reduced our sysadmin overhead. Now Tyler's Cloud Team is building us separate sandbox, test and prod accounts, and I'm getting our apps ready for containers and using ElastiCache to improve load balancing.
- **Keeping the stack current.** I'm moving our Grails apps from Grails 3 on Java 11 to Grails 5 on Java 17, and our databases from Oracle to Aurora PostgreSQL. The newer services run on Java 21. I run the PCI DSS security scans on production deployments and write the audit documentation for outside approval.
- **Brought AI-assisted development into the office.** I made the case to leadership for letting developers experiment, and was an early-access AI champion in Tyler's rollout, testing sign-on, central billing and platforms ahead of the wider launch. I wrote the Claude Code conventions for how we build Grails apps with our in-house auth, billing and look-and-feel plugins. I introduced Playwright, and pushed us to use AI to write the tests and documentation we never had time for.
