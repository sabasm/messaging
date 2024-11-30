export interface Environment {
 production: boolean;
 development: boolean;
}

export const getEnvironmentState = (): Environment => ({
 production: process.env.NODE_ENV === 'production',
 development: !process.env.NODE_ENV || process.env.NODE_ENV === 'development'
});

