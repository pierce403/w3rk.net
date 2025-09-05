export type Job = {
  id: string;
  title: string;
  budget: string;
  desc: string;
};

export const jobs: Job[] = [];

export type Service = {
  id: string;
  title: string;
  rate: string;
  desc: string;
  user: string;
};

export const services: Service[] = [];

export type Skill = {
  user: string;
  name: string;
  endorsements: string[];
};

export const skills: Skill[] = [];
