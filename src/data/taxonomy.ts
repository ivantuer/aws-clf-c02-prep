export const DOMAINS = {
  1: { id: 1, name: 'Cloud Concepts', weight: 24 },
  2: { id: 2, name: 'Security and Compliance', weight: 30 },
  3: { id: 3, name: 'Cloud Technology and Services', weight: 34 },
  4: { id: 4, name: 'Billing, Pricing, and Support', weight: 12 },
} as const;

export const TASK_STATEMENTS = {
  '1.1': 'Define the benefits of the AWS Cloud',
  '1.2': 'Identify design principles of the AWS Cloud',
  '1.3': 'Understand the benefits of and strategies for migration to the AWS Cloud',
  '1.4': 'Understand concepts of cloud economics',
  '2.1': 'Understand the AWS shared responsibility model',
  '2.2': 'Understand AWS Cloud security, governance, and compliance concepts',
  '2.3': 'Identify AWS access management capabilities',
  '2.4': 'Identify components and resources for security',
  '3.1': 'Define methods of deploying and operating in the AWS Cloud',
  '3.2': 'Define the AWS global infrastructure',
  '3.3': 'Identify AWS compute services',
  '3.4': 'Identify AWS database services',
  '3.5': 'Identify AWS network services',
  '3.6': 'Identify AWS storage services',
  '3.7': 'Identify AWS artificial intelligence and machine learning (AI/ML) services and analytics services',
  '3.8': 'Identify services from other in-scope AWS service categories',
  '4.1': 'Compare AWS pricing models',
  '4.2': 'Understand resources for billing, budget, and cost management',
  '4.3': 'Identify AWS technical resources and AWS Support options',
} as const;

export type TaskStatementId = keyof typeof TASK_STATEMENTS;
export type DomainId = keyof typeof DOMAINS;

export const EXAM_GUIDE_URL =
  'https://docs.aws.amazon.com/aws-certification/latest/cloud-practitioner-02/cloud-practitioner-02.html';

export const TASK_STATEMENT_IDS = Object.keys(TASK_STATEMENTS) as TaskStatementId[];

export function domainOf(task: TaskStatementId): DomainId {
  return Number(task.split('.')[0]) as DomainId;
}

export function taskStatementUrl(task: TaskStatementId): string {
  return `https://docs.aws.amazon.com/aws-certification/latest/cloud-practitioner-02/cloud-practitioner-02-domain${domainOf(task)}.html`;
}
