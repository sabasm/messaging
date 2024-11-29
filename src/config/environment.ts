export const getEnvironmentState = () => ({
    production: process.env.NODE_ENV === 'production',
    development: !process.env.NODE_ENV || process.env.NODE_ENV === 'development'
});
