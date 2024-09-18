import {Resolvers} from "../.mesh";

const resolvers: Resolvers = {
    Query: {
        semanticSearch: {
            async resolve(root, args, context, info) {
                // get a list of all courses the user has access to
                let courseMembershipsRes = await context.CourseService.Query._internal_noauth_courseMembershipsByUserId({
                    root,
                    args: {
                        userId: context.currentUser.id,
                        availabilityFilter: true
                    },
                    selectionSet: `
                    {
                        courseId
                    }
                    `
                });

                // get a list of all media records in the courses the user has access to and, in case a whitelist is 
                // provided, only consider the courses in the whitelist
                let mediaRecordsRes = await context.MediaService.Query._internal_noauth_mediaRecordsForCourses({
                    root,
                    args: {
                        courseIds: courseMembershipsRes
                            .map((membership) => membership.courseId)
                            .filter((courseId) => args.courseWhitelist?.includes(courseId) ?? true)
                    },
                    selectionSet: `
                    {
                        id
                    }
                    `
                });

                let mediaRecordWhitelist = mediaRecordsRes.flat().map((mediaRecord) => mediaRecord.id);
                console.log(mediaRecordsRes);

                // run the semantic search
                return context.DocprocaiService.Query._internal_noauth_semanticSearch({
                    root,
                    args: {
                        queryText: args.queryText,
                        count: args.count,
                        mediaRecordWhitelist: mediaRecordWhitelist
                    },
                    context,
                    info
                });
            }
        }
    }
}

export default resolvers;