import React, { useState, useContext, useMemo, useCallback } from "react";
import axios from "../../config/api/axios";
import UserContext from "../../Hooks/UserContext";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaFileDownload,
  FaSearch,
  FaFilter,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { TableHeader } from "../Table";
import ErrorStrip from "../ErrorStrip";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const InternalResultForm = () => {
  const { paperList, user } = useContext(UserContext);
  const [paper, setPaper] = useState("");
  const [paperDetails, setPaperDetails] = useState(null);
  const [disabled, setDisabled] = useState(true);
  const [internal, setInternal] = useState([]);
  const [id, setId] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [bulkValue, setBulkValue] = useState({
    test: "",
    seminar: "",
    assignment: "",
    attendance: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });

  // Validation Function
  const validateMarks = useCallback((student) => {
    const { test, seminar, assignment, attendance } = student;
    return (
      test >= 0 &&
      test <= 5 &&
      seminar >= 0 &&
      seminar <= 5 &&
      assignment >= 0 &&
      assignment <= 5 &&
      attendance >= 0 &&
      attendance <= 5
    );
  }, []);

  // Error Handling
  const handleApiError = useCallback((err) => {
    const errorMessage =
      err.response?.data?.message || "An unexpected error occurred";
    toast.error(errorMessage, {
      position: "top-right",
      autoClose: 3000,
    });
    setError(errorMessage);
  }, []);

  // Fetch Internal Marks
  const fetchInternal = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setInternal([]);
    setError("");

    try {
      const response = await axios.get("/internal/" + paper);
      setId(response.data._id);
      setInternal(response.data.marks);
      setPaperDetails(response.data.paperDetails);
      setDisabled(true);
      setError("");
    } catch (err) {
      try {
        if (err.response.status === 404) {
          const response = await axios.get("paper/" + paper);
          const students = response.data.students;
          setPaperDetails(response.data);
          students.forEach((student) => {
            Object.assign(student, {
              test: 0,
              seminar: 0,
              assignment: 0,
              attendance: 0,
              total: 0,
            });
          });
          setInternal(students);
          setDisabled(false);
        }
      } catch (fetchErr) {
        handleApiError(fetchErr);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Add/Update Internal Marks
  const addInternalMark = async (e) => {
    e.preventDefault();

    // Validate all entries
    if (!internal.every(validateMarks)) {
      toast.error("Please ensure all marks are between 0-5");
      return;
    }

    const marks = { id, paper, marks: internal };
    try {
      const response = await axios.post("internal/" + paper, marks);
      toast.success(response.data.message);
      setDisabled(true);
      setError("");
      fetchInternal(e);
    } catch (err) {
      if (err.response.status === 409) {
        try {
          const response = await axios.patch("internal/" + paper, marks);
          toast.success(response.data.message);
          setDisabled(true);
          setError("");
        } catch (updateErr) {
          handleApiError(updateErr);
        }
      } else {
        handleApiError(err);
      }
    }
  };

  // Delete Internal Marks
  const deleteInternalMark = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.delete("internal/" + id);
      toast.success(response.data.message, {
        icon: ({ theme, type }) => <FaTrash />,
      });
      setInternal([]);
    } catch (err) {
      handleApiError(err);
    }
  };

  // Handle Form Change
  const handleFormChange = (e) => {
    const index = parseInt(e.target.id);
    const value = e.target.value;
    const key = e.target.name;
    const newStudent = { ...internal[index] };
    newStudent[key] = value;

    newStudent.total =
      parseInt(newStudent.test || 0) +
      parseInt(newStudent.seminar || 0) +
      parseInt(newStudent.assignment || 0) +
      parseInt(newStudent.attendance || 0);

    const newInternal = [...internal];
    newInternal[index] = newStudent;

    setInternal(newInternal);
  };

  // Bulk Edit
  const applyBulkEdit = () => {
    const updatedInternal = internal.map((student) => ({
      ...student,
      test: bulkValue.test
        ? (parseInt(student.test) + parseInt(bulkValue.test)).toString()
        : student.test,
      seminar: bulkValue.seminar
        ? (parseInt(student.seminar) + parseInt(bulkValue.seminar)).toString()
        : student.seminar,
      assignment: bulkValue.assignment
        ? (
            parseInt(student.assignment) + parseInt(bulkValue.assignment)
          ).toString()
        : student.assignment,
      attendance: bulkValue.attendance
        ? (
            parseInt(student.attendance) + parseInt(bulkValue.attendance)
          ).toString()
        : student.attendance,
      total:
        parseInt(
          bulkValue.test
            ? student.test + parseInt(bulkValue.test)
            : student.test
        ) +
        parseInt(
          bulkValue.seminar
            ? student.seminar + parseInt(bulkValue.seminar)
            : student.seminar
        ) +
        parseInt(
          bulkValue.assignment
            ? student.assignment + parseInt(bulkValue.assignment)
            : student.assignment
        ) +
        parseInt(
          bulkValue.attendance
            ? student.attendance + parseInt(bulkValue.attendance)
            : student.attendance
        ),
    }));
    setInternal(updatedInternal);
    setBulkEditMode(false);
    setBulkValue({
      test: "",
      seminar: "",
      assignment: "",
      attendance: "",
    });
  };

  // Advanced PDF Export
  const downloadPDF = (options = {}) => {
    const {
      includeAllColumns = true,
      colorCodeHighScorers = true,
      logoPath,
    } = options;
    const doc = new jsPDF();

    // College Header
    doc.setFontSize(14);
    doc.text("S.G. Balekundri Institute Of Technology", 65, 15);

    // Add logo if provided
    if (logoPath) {
      doc.addImage(logoPath, "PNG", 50, 5, 15, 15);
    }

    // Subheading with Paper Details
    doc.setFontSize(12);
    // doc.text(`Subject: ${paperDetails?.paper || "N/A"}`, 14, 25);
    let subject = "N/A"; // Default value

    if (user._id === "674f456ce4c97f1b5ee97ab1") {
      subject = "Computer Networks"; // Set to "Computer Networks" if user_.id matches
    } else if (user._id === "674f455be4c97f1b5ee97aae") {
      subject = "Fundamentals of Management"; // Set to "Computer Networks" if user_.id matches
    } else if (user._id === "674f4549e4c97f1b5ee97aab") {
      subject = "Research Methodology and IPR"; // Set to "Computer Networks" if user_.id matches
    } else if (user._id === "674eaf01f51ddcddb208e92c") {
      subject = "Web Technology"; // Set to "Computer Networks" if user_.id matches
    }

    doc.text(`Subject: ${subject}`, 14, 25);
    doc.text(`Staff: ${user?.name || "N/A"}`, 14, 32);
    doc.text(`Semester: ${paperDetails?.semester || "5"}`, 14, 39);

    // Main Heading
    doc.setFontSize(16);
    doc.text(`Internal Marks`, 14, 50);

    const headers = [
      ["Student", "Test", "Seminar", "Assignment", "Attendance", "Total"],
    ];

    const data = internal.map((student) => [
      student.name,
      student.test,
      student.seminar,
      student.assignment,
      student.attendance,
      student.total,
    ]);

    doc.autoTable({
      startY: 60, // Adjusted to make room for additional details
      head: headers,
      body: data,
      theme: colorCodeHighScorers ? "striped" : "plain",
      didParseCell: (data) => {
        if (colorCodeHighScorers && data.section === "body") {
          const total = parseFloat(data.cell.raw);
          if (total > 15) {
            data.cell.styles.fillColor = [173, 216, 230];
          }
        }
      },
    });

    // Add a note about color coding
    doc.setFontSize(10);
    doc.text(
      "Note: Blue rows indicate total marks > 15",
      14,
      doc.autoTable.previous.finalY + 10
    );

    doc.save(
      `internal_marks_${paperDetails?.paper || "marks"}_${
        new Date().toISOString().split("T")[0]
      }.pdf`
    );
  };

  // Filtered and Sorted Students
  const filteredAndSortedStudents = useMemo(() => {
    let result = [...internal];

    if (searchTerm) {
      result = result.filter((student) =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sortConfig.key) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [internal, searchTerm, sortConfig]);

  return (
    <main className="internal p-4">
      <h2 className="mb-4 text-4xl font-bold text-violet-950 underline dark:text-slate-400 md:text-6xl">
        Internal Mark Management
      </h2>
      {/* Paper Selection and Fetch Section */}
      <section className="form__head mb-4">
        <form className="w-full gap-4 md:flex">
          <select
            className="mb-4 block h-10 w-full rounded-md border-[1.5px] border-slate-400 p-1 dark:border-slate-200 md:w-1/3"
            value={paper}
            onChange={(e) => setPaper(e.target.value)}
            required
          >
            <option value="" hidden>
              Select Paper
            </option>
            {paperList.map((paper) => (
              <option key={paper._id} value={paper._id}>
                {paper.paper}
              </option>
            ))}
          </select>
          <button
            className="mb-4 h-10 w-auto rounded-md border-violet-900 bg-slate-800 px-8 text-white dark:bg-violet-900"
            onClick={fetchInternal}
            disabled={!paper || isLoading}
          >
            {isLoading ? "Fetching..." : "Fetch"}
          </button>
        </form>
      </section>

      {/* Error Handling */}
      {error && <ErrorStrip error={error} />}

      {/* Student Marks Section */}
      <section className="internal__body">
        {internal.length > 0 && (
          <>
            {/* Search and Filter Controls */}
            <div className="mb-4 flex gap-4">
              <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded border py-2 pl-10 pr-4"
                />
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
              </div>
              <button
                onClick={() => setBulkEditMode(!bulkEditMode)}
                className="flex items-center gap-2 rounded bg-violet-100 px-4 py-2 text-white dark:bg-violet-900"
              >
                <FaFilter /> Bulk Edit
              </button>
            </div>

            {/* Bulk Edit Section */}
            {bulkEditMode && (
              <div className="  mb-4  flex gap-10 rounded bg-violet-50 p-4 dark:bg-violet-900">
                {["test", "seminar", "assignment", "attendance"].map(
                  (field) => (
                    <input
                      key={field}
                      type="number"
                      placeholder={`Bulk ${field}`}
                      min="0"
                      max="5"
                      value={bulkValue[field]}
                      onChange={(e) =>
                        setBulkValue((prev) => ({
                          ...prev,
                          [field]: e.target.value,
                        }))
                      }
                      className="p-2border w-40 rounded border px-4 px-4 text-white"
                    />
                  )
                )}
                <button
                  onClick={applyBulkEdit}
                  className="bg-white-900 rounded border px-4 px-4 py-2 py-2 text-white"
                >
                  Apply
                </button>
              </div>
            )}

            {/* Student Marks Table */}
            <div className="overflow-x-auto">
              <table className="w-full rounded border px-4 py-2">
                <TableHeader
                  Headers={[
                    "Student",
                    "Test",
                    "Seminar",
                    "Assignment",
                    "Attendance",
                    "Total",
                  ]}
                />
                <tbody>
                  {filteredAndSortedStudents.map((student, index) => (
                    <tr
                      key={index}
                      className={`border-t ${
                        student.total > 15
                          ? "bg-black-100"
                          : "border-t-[1px] border-slate-400 bg-violet-900/50 first:border-none"
                      }`}
                    >
                      <td className="p-2 text-white">{student.name}</td>
                      {["test", "seminar", "assignment", "attendance"].map(
                        (field) => (
                          <td key={field} className="p-2 text-white">
                            <input
                              type="number"
                              min="0"
                              max="5"
                              disabled={disabled}
                              id={index}
                              name={field}
                              value={student[field]}
                              onChange={handleFormChange}
                              className="w-full text-center"
                            />
                          </td>
                        )
                      )}
                      <td className="p-2 text-center font-bold text-white">
                        {student.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex gap-4">
              {disabled ? (
                <button
                  onClick={() => setDisabled(false)}
                  className="flex items-center gap-2 rounded bg-violet-900 px-4 py-2 text-white"
                >
                  <FaEdit /> Edit Marks
                </button>
              ) : (
                <button
                  onClick={addInternalMark}
                  className="flex items-center gap-2 rounded bg-green-600 px-4 py-2 text-white"
                >
                  <FaPlus /> Save Marks
                </button>
              )}

              <button
                onClick={() => downloadPDF({ logoPath: "/favicon.png" })}
                className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-white"
              >
                <FaFileDownload /> Download PDF
              </button>
              <button
                onClick={deleteInternalMark}
                className="flex items-center gap-2 rounded bg-red-600 px-4 py-2 text-white"
              >
                <FaTrash /> Delete Marks
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
};

export default InternalResultForm;
