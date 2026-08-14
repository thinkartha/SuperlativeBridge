import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, BookOpen, Bookmark } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useEnrollments,
  useUnenroll,
  useEnroll,
} from "@/hooks/api/useEnrollments";
import { useSavedCourses, useUnsaveCourse } from "@/hooks/api/useSavedCourses";

const PAGE_SIZE = 6;

const MyCourses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    data: enrollments,
    isLoading: enrollLoading,
    isError: enrollError,
    refetch: refetchEnrollments,
  } = useEnrollments(user?.id);
  const {
    data: savedCourses,
    isLoading: savedLoading,
    isError: savedError,
    refetch: refetchSaved,
  } = useSavedCourses(user?.id);
  const unenrollMutation = useUnenroll(user?.id);
  const unsaveMutation = useUnsaveCourse(user?.id);
  const enrollMutation = useEnroll(user?.id);

  const [enrolledPage, setEnrolledPage] = useState(1);
  const [savedPage, setSavedPage] = useState(1);

  const enrolledList = enrollments ?? [];
  const savedList = savedCourses ?? [];

  const enrolledTotalPages = Math.max(
    1,
    Math.ceil(enrolledList.length / PAGE_SIZE),
  );
  const currentEnrolledPage = Math.min(enrolledPage, enrolledTotalPages);
  const pagedEnrolled = useMemo(
    () =>
      enrolledList.slice(
        (currentEnrolledPage - 1) * PAGE_SIZE,
        currentEnrolledPage * PAGE_SIZE,
      ),
    [enrolledList, currentEnrolledPage],
  );

  const savedTotalPages = Math.max(1, Math.ceil(savedList.length / PAGE_SIZE));
  const currentSavedPage = Math.min(savedPage, savedTotalPages);
  const pagedSaved = useMemo(
    () =>
      savedList.slice(
        (currentSavedPage - 1) * PAGE_SIZE,
        currentSavedPage * PAGE_SIZE,
      ),
    [savedList, currentSavedPage],
  );

  if (!user) {
    return (
      <div className="text-center py-24">
        <p className="text-muted-foreground mb-4">
          Sign in to view your courses.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">
          My Courses
        </h1>
        <p className="text-muted-foreground mt-1">
          Track progress on courses you're taking and manage saved courses.
        </p>
      </div>

      {/* In progress / enrolled */}
      <section className="space-y-4">
        <h2 className="text-xl font-heading font-semibold text-foreground flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" /> In Progress
        </h2>

        {enrollLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        )}

        {enrollError && !enrollLoading && (
          <div className="bg-card border border-border py-10 text-center">
            <p className="text-muted-foreground mb-4">
              Unable to load your enrolled courses.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchEnrollments()}
            >
              Try Again
            </Button>
          </div>
        )}

        {!enrollLoading && !enrollError && enrolledList.length === 0 && (
          <div className="bg-card border border-border py-12 text-center">
            <p className="text-muted-foreground mb-4">
              You haven't enrolled in any courses yet.
            </p>
            <Button variant="hero" asChild>
              <Link to="/courses">Browse Catalog</Link>
            </Button>
          </div>
        )}

        {!enrollLoading && !enrollError && enrolledList.length > 0 && (
          <>
            <div className="bg-card border border-border divide-y divide-border">
              {pagedEnrolled.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="p-5 flex flex-col md:flex-row md:items-center gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-foreground">
                        {enrollment.course?.title ?? "Course"}
                      </p>
                      {enrollment.grade && (
                        <Badge variant="secondary" className="text-xs">
                          {enrollment.grade}
                        </Badge>
                      )}
                    </div>
                    <Progress
                      value={enrollment.progress}
                      className="h-1.5 my-2 max-w-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      {enrollment.progress}% complete · XP {enrollment.xp}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="hero"
                      onClick={() =>
                        navigate(`/courses/${enrollment.courseId}`)
                      }
                    >
                      Resume
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={unenrollMutation.isPending}
                      onClick={() => unenrollMutation.mutate(enrollment.id)}
                    >
                      Unenroll
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {enrolledTotalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {currentEnrolledPage} of {enrolledTotalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1"
                    disabled={currentEnrolledPage <= 1}
                    onClick={() => setEnrolledPage(currentEnrolledPage - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1"
                    disabled={currentEnrolledPage >= enrolledTotalPages}
                    onClick={() => setEnrolledPage(currentEnrolledPage + 1)}
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Saved courses */}
      <section className="space-y-4">
        <h2 className="text-xl font-heading font-semibold text-foreground flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-primary" /> Saved Courses
        </h2>

        {savedLoading && (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        )}

        {savedError && !savedLoading && (
          <div className="bg-card border border-border py-10 text-center">
            <p className="text-muted-foreground mb-4">
              Unable to load saved courses.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetchSaved()}>
              Try Again
            </Button>
          </div>
        )}

        {!savedLoading && !savedError && savedList.length === 0 && (
          <div className="bg-card border border-border py-12 text-center">
            <p className="text-muted-foreground mb-4">
              You haven't saved any courses yet.
            </p>
            <Button variant="outline" asChild>
              <Link to="/courses">Browse Catalog</Link>
            </Button>
          </div>
        )}

        {!savedLoading && !savedError && savedList.length > 0 && (
          <>
            <div className="bg-card border border-border divide-y divide-border">
              {pagedSaved.map((saved) => (
                <div
                  key={saved.id}
                  className="p-5 flex flex-col md:flex-row md:items-center gap-4"
                >
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {saved.course?.title ?? "Course"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {saved.course?.instructor}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="hero"
                      disabled={enrollMutation.isPending}
                      onClick={() => enrollMutation.mutate(saved.courseId)}
                    >
                      Enroll
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={unsaveMutation.isPending}
                      onClick={() => unsaveMutation.mutate(saved.courseId)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {savedTotalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {currentSavedPage} of {savedTotalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1"
                    disabled={currentSavedPage <= 1}
                    onClick={() => setSavedPage(currentSavedPage - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1"
                    disabled={currentSavedPage >= savedTotalPages}
                    onClick={() => setSavedPage(currentSavedPage + 1)}
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default MyCourses;
