interface User {
  id: number;
  name: string;
  roles: string[];
}

export interface Context {
  user?: User;
}

const context = async (): Promise<Context> => {
  return {
    user: {
      id: 1,
      name: 'Sample user',
      roles: ['ADMIN'],
    },
  };
};

export { context };
