import {Resolvers} from "../.mesh";

/**
 * Helper function to get a list of content ids the user has access to.
 * @param context GraphQL context
 * @param root  GraphQL root
 * @param courseWhitelist Additional whitelist of course ids. If not null, only contents which the user has access
 * to AND are in at least one of the courses in the whitelist are returned
 * @returns List of content ids the user has access to
 */
async function getContentIdsUserHasAccessTo(context, info, root, courseWhitelist) {
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
    let mediaRecordsRes = await context.ContentService.Query._internal_noauth_contentsAvailableToBeWorkedOnByUserForCourses({
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
        `,
        context,
        info
    });

    let contentWhitelist = mediaRecordsRes.flat().map((mediaRecord) => mediaRecord.id);

    return contentWhitelist;
}

const resolvers: Resolvers = {
    Mutation: {
        createMediaContentAndLinkRecords: {
            async resolve(root, _args, context, info) {
                // find out in which course the chapter this content should be created in is
                let chapters = await context.CourseService.Query._internal_noauth_chaptersByIds({
                    root,
                    args: {
                        ids: [_args.contentInput.metadata.chapterId]
                    },
                    selectionSet: `
                    {
                        course {
                            id
                        }
                    }
                    `,
                });

                if (chapters.length !== 1) {
                    throw new Error("Chapter with given id does not exist.");
                }

                let courseId = chapters[0].course.id;

                // check that the user is an admin in the course the content should be created in
                if (!context.currentUser.courseMemberships.some((membership) => {
                    return membership.courseId === courseId && membership.role === "ADMINISTRATOR";
                })) {
                    throw new Error("User is not enrolled and/or an admin in the course the assessment should be created in.");
                }

                // create the content object using the createMediaContent query of the content service
                let content = await context.ContentService.Mutation._internal_createMediaContent({
                    root,
                    args: {
                        input: _args.contentInput,
                        courseId: courseId,
                    },
                    context,
                    info
                });

                // link the created content to the passed media records
                await context.MediaService.Mutation.setLinkedMediaRecordsForContent({
                    root,
                    args: {
                        contentId: content.id,
                        mediaRecordIds: _args.mediaRecordIds
                    },
                    // we need to define a selection set manually here, otherwise it thinks we don't need any data
                    // from this mutation and it won't actually be executed
                    selectionSet: `
                    {
                        id
                    }
                    `,
                    context,
                    info
                });

                return content;
            }
        },
        createQuizAssessment: {
            async resolve(root, _args, context, info) {
                // find out in which course the chapter this assessment should be created in is
                let chapters = await context.CourseService.Query._internal_noauth_chaptersByIds({
                    root,
                    args: {
                        ids: [_args.assessmentInput.metadata.chapterId]
                    },
                    selectionSet: `
                    {
                        course {
                            id
                        }
                    }
                    `,
                });

                if (chapters.length !== 1) {
                    throw new Error("Chapter with given id does not exist.");
                }

                let courseId = chapters[0].course.id;

                // check that the user is an admin in the course the assessment should be created in
                if (!context.currentUser.courseMemberships.some((membership) => {
                    return membership.courseId === courseId && membership.role === "ADMINISTRATOR";
                })) {
                    throw new Error("User is not enrolled and/or an admin in the course the assessment should be created in.");
                }

                // create the assessment
                let content = await context.ContentService.Mutation._internal_createAssessment({
                    root,
                    args: {
                        courseId: courseId,
                        input: _args.assessmentInput
                    },
                    context,
                    info
                });

                // create the quiz
                await context.QuizService.Mutation._internal_noauth_createQuiz({
                    root,
                    args: {
                        courseId: courseId,
                        assessmentId: content.id,
                        input: _args.quizInput
                    },
                    // we need to define a selection set manually here, otherwise it thinks we don't need any data
                    // from this mutation and it won't actually be executed
                    selectionSet: `
                    {
                        assessmentId
                    }
                    `,
                });

                return content;
            }
        },
        createFlashcardSetAssessment: {
            async resolve(root, _args, context, info) {
                // find out in which course the chapter this assessment should be created in is
                let chapters = await context.CourseService.Query._internal_noauth_chaptersByIds({
                    root,
                    args: {
                        ids: [_args.assessmentInput.metadata.chapterId]
                    },
                    selectionSet: `
                    {
                        course {
                            id
                        }
                    }
                    `,
                });

                if (chapters.length !== 1) {
                    throw new Error("Chapter with given id does not exist.");
                }

                let courseId = chapters[0].course.id;

                // check that the user is an admin in the course the assessment should be created in
                if (!context.currentUser.courseMemberships.some((membership) => {
                    return membership.courseId === courseId && membership.role === "ADMINISTRATOR";
                })) {
                    throw new Error("User is not enrolled and/or an admin in the course the assessment should be created in.");
                }

                // create the assessment
                let content = await context.ContentService.Mutation._internal_createAssessment({
                    root,
                    args: {
                        courseId: courseId,
                        input: _args.assessmentInput
                    },
                    context,
                    info
                });

                // create the flashcard set
                let flashcardSet = await context.FlashcardService.Mutation._internal_noauth_createFlashcardSet({
                    root,
                    args: {
                        courseId: courseId,
                        assessmentId: content.id,
                        input: _args.flashcardSetInput
                    },
                    // we need to define a selection set manually here, otherwise it thinks we don't need any data
                    // from this mutation and it won't actually be executed
                    selectionSet: `
                    {
                        assessmentId
                    }
                    `,
                });

                return content;
            },

        },


    },
    Query: {
        semanticSearch: {
            async resolve(root, args, context, info) {
                const contentWhitelist = await getContentIdsUserHasAccessTo(context, info, root, args.courseWhitelist);

                // run the semantic search
                return context.DocprocaiService.Query._internal_noauth_semanticSearch({
                    root,
                    args: {
                        queryText: args.queryText,
                        count: args.count,
                        contentWhitelist: contentWhitelist
                    },
                    context,
                    info
                });
            }
        },
        getSemanticallySimilarEntities: {
            async resolve(root, args, context, info) {
                let contentWhitelist: string[] = await getContentIdsUserHasAccessTo(context, info, root, null);
    
                // get semantically similar segments
                return context.DocprocaiService.Query._internal_noauth_getSemanticallySimilarEntities({
                    root,
                    args: {
                        segmentId: args.segmentId,
                        count: args.count,
                        contentWhitelist: contentWhitelist,
                        excludeEntitiesWithSameParent: args.excludeEntitiesWithSameParent
                    },
                    context,
                    info
                });
            }
        }
    }
}

export default resolvers;
