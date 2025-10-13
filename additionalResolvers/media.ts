import {Resolvers} from "../.mesh";

const resolvers: Resolvers = {
    MediaRecord: {
        contents: {
            selectionSet: `
            {
                contentIds
            }
            `,
            async resolve(root, _args, context, info) {
                return await context.ContentService.Query.findContentsByIds({
                    root,
                    args: {
                        ids: root.contentIds
                    },
                    context,
                    info,
                });
            }
        }
    }
}

export default resolvers;