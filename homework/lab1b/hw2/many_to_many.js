
const mongoose = require("mongoose");

const { Schema } = mongoose;

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/course_registration_db")
    .then(() => console.log("Connected to MongoDB"))
    .catch(error => console.log("Connection error:", error.message));

// Student schema
const studentSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    courses: [{
        type: Schema.Types.ObjectId,
        ref: "Course"
    }]
});

// Course schema
const courseSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    students: [{
        type: Schema.Types.ObjectId,
        ref: "Student"
    }],
    maxStudents: {
        type: Number,
        required: true
    },
    availableSlots: {
        type: Number,
        required: true
    }
});

const Student = mongoose.model("Student", studentSchema);
const Course = mongoose.model("Course", courseSchema);

// 1. Enroll a student in a course
async function enrollCourse(studentId, courseId) {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const student = await Student.findById(studentId).session(session);
        const course = await Course.findById(courseId).session(session);

        if (!student) {
            throw new Error("Student not found");
        }

        if (!course) {
            throw new Error("Course not found");
        }

        // Check if the student is already enrolled
        if (student.courses.some(id => id.equals(courseId))) {
            throw new Error("Student is already enrolled");
        }

        // Check available slots
        if (course.availableSlots <= 0) {
            throw new Error("Course is full");
        }

        // Add course to student's courses
        student.courses.push(course._id);

        // Add student to course's students
        course.students.push(student._id);

        // Decrease available slots
        course.availableSlots -= 1;

        // Save both documents in the same transaction
        await student.save({ session });
        await course.save({ session });

        await session.commitTransaction();

        console.log("Enrollment successful!");
        return true;

    } catch (error) {
        await session.abortTransaction();
        console.log("Enrollment failed:", error.message);
        return false;

    } finally {
        await session.endSession();
    }
}

// 2. Drop a course
async function dropCourse(studentId, courseId) {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const student = await Student.findById(studentId).session(session);
        const course = await Course.findById(courseId).session(session);

        if (!student) {
            throw new Error("Student not found");
        }

        if (!course) {
            throw new Error("Course not found");
        }

        // Check whether the student is enrolled
        const enrolled = student.courses.some(id => id.equals(courseId));

        if (!enrolled) {
            throw new Error("Student is not enrolled in this course");
        }

        // Remove course from student's courses
        student.courses = student.courses.filter(
            id => !id.equals(courseId)
        );

        // Remove student from course's students
        course.students = course.students.filter(
            id => !id.equals(studentId)
        );

        // Return one slot
        course.availableSlots += 1;

        // Save both documents in the same transaction
        await student.save({ session });
        await course.save({ session });

        await session.commitTransaction();

        console.log("Course dropped successfully!");
        return true;

    } catch (error) {
        await session.abortTransaction();
        console.log("Drop course failed:", error.message);
        return false;

    } finally {
        await session.endSession();
    }
}

// Example usage
async function main() {
    try {
        // Create sample records for testing
        const student = await Student.create({
            name: "Nguyen An",
            courses: []
        });

        const course = await Course.create({
            name: "Database Systems",
            students: [],
            maxStudents: 2,
            availableSlots: 2
        });

        console.log("\nStudent ID:", student._id.toString());
        console.log("Course ID:", course._id.toString());

        // Test enrollment
        await enrollCourse(student._id, course._id);

        // Test dropping the course
        await dropCourse(student._id, course._id);

        // Display final database records
        const updatedStudent = await Student.findById(student._id);
        const updatedCourse = await Course.findById(course._id);

        console.log("\nFinal student record:", updatedStudent);
        console.log("Final course record:", updatedCourse);

    } catch (error) {
        console.log("Program error:", error.message);
    } finally {
        await mongoose.disconnect();
    }
}

// Start only after MongoDB connects
mongoose.connection.once("open", main);
