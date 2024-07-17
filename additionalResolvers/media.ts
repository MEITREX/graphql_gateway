import {Resolvers} from "../.mesh";

const resolvers: Resolvers = {
    Query: {
        semanticSearch: {
            async resolve(root, args, context, info) {
                // get a list of all courses the user has access to
                let courseMemberships = await context.CourseService.Query._internal_noauth_courseMembershipsByUserId({
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

                // get a list of all media records in the courses the user has access to
                let mediaRecords = await context.MediaService.Query._internal_noauth_mediaRecordsForCourses({
                    root,
                    args: {
                        courseIds: courseMemberships.map((membership) => membership.courseId)
                    },
                    selectionSet: `
                    {
                        id
                    }
                    `
                });

                let mediaRecordWhitelist = mediaRecords.flat().map((mediaRecord) => mediaRecord.id);
                console.log(mediaRecords);

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