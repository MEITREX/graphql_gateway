import {Resolvers} from "../.mesh";

/**
 * Helper function to get a list of media record ids the user has access to.
 * @param context GraphQL context
 * @param root  GraphQL root
 * @param courseWhitelist Additional whitelist of course ids. If not null, only records which the user has access
 * to AND are in at least one of the courses in the whitelist are returned
 * @returns List of media record ids the user has access to
 */
async function getMediaRecordIdsUserHasAccessTo(context, root, courseWhitelist) {
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
                .filter((courseId) => courseWhitelist?.includes(courseId) ?? true)
        },
        selectionSet: `
        {
            id
        }
        `
    });

    let mediaRecordWhitelist = mediaRecordsRes.flat().map((mediaRecord) => mediaRecord.id);

    return mediaRecordWhitelist;
}
const resolvers: Resolvers = {
    Query: {
        semanticSearch: {
            async resolve(root, args, context, info) {
                const mediaRecordWhitelist = await getMediaRecordIdsUserHasAccessTo(context, root, args.courseWhitelist);

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
        },
        getSemanticallySimilarMediaRecordSegments: {
            async resolve(root, args, context, info) {
                let mediaRecordWhitelist: string[] = await getMediaRecordIdsUserHasAccessTo(context, root, null);
                
                // if excludeOwnMediaRecord is set, remove the media record the segment is part of from the whitelist
                if(args.excludeOwnMediaRecord) {
                    // get the id of the media record this segment is part of
                    const mediaRecordId = (await context.DocprocaiService.Query._internal_noauth_getMediaRecordSegmentById({
                        root,
                        args: {
                            mediaRecordSegmentId: args.mediaRecordSegmentId
                        },
                        selectionSet: `
                        {
                            mediaRecordId
                        }
                        `
                    })).mediaRecordId;
                    mediaRecordWhitelist = mediaRecordWhitelist.filter((id) => id !== mediaRecordId);
                }
    
                // get semantically similar segments
                return context.DocprocaiService.Query._internal_noauth_getSemanticallySimilarMediaRecordSegments({
                    root,
                    args: {
                        mediaRecordSegmentId: args.mediaRecordSegmentId,
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