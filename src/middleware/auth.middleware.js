export const authenticate = async (request, reply) => {
    try {
        const token = request.headers.authorization?.split(' ')[1];

        if (!token) {
            throw new Error('No token provided');
        }

        // TODO: 토큰 검증 로직 구현
        // const decoded = await verifyToken(token);
        // request.user = decoded;

        return;
    } catch (error) {
        reply.status(401).send({
            status: 'error',
            message: 'Unauthorized'
        });
    }
}; 