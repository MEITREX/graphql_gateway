import { Resolvers } from "../.mesh";

const resolvers: Resolvers = {
    UserInfo: {
        availableCourseMemberships: {
            selectionSet: `{ id }`,
            async resolve(root, args, context, info) {
                return context.CourseService.Query._internal_noauth_courseMembershipsByUserId({
                    root,
                    args: {
                        userId: root.id,
                        availabilityFilter: true,
                    },
                    context,
                    info,
                });
            }
        },
        unavailableCourseMemberships: {
            selectionSet: `{ id }`,
            async resolve(root, args, context, info) {
                return context.CourseService.Query._internal_noauth_courseMembershipsByUserId({
                    root,
                    args: {
                        userId: root.id,
                        availabilityFilter: false,
                    },
                    context,
                    info,
                });
            }
        }
    }
};

export default resolvers;