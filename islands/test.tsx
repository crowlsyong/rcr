import { useState } from "preact/hooks";

export default function Test() {
  const [lender, setLender] = useState("");
  const [loanAmount, setLoanAmount] = useState<number | "">("");
  const [borrower, setBorrower] = useState("");
  const [lenderFee, setLenderFee] = useState<number | "">("");
  const [dueDate, setDueDate] = useState("");
  const [coverage, setCoverage] = useState("");

  return (
    <div class="bg-[#0F1729] p-6 rounded-lg shadow-lg w-full max-w-md space-y-6">
      {/* Grid container for all three lines */}
      <div class="grid grid-cols-[5fr_1fr_5fr_1fr] gap-4 mb-6">
        {/* Line 1 */}
        <input
          type="text"
          placeholder="Lender Username"
          value={lender}
          onInput={(e) => setLender((e.target as HTMLInputElement).value)}
          class="w-full p-2 rounded bg-[#1D2A46] text-[#98A9CE] placeholder-[#3D4E73] focus:outline-none"
        />
        <p class="text-[#98A9CE] text-xs sm:text-sm flex items-center justify-center">
          lending
        </p>
        <input
          type="number"
          placeholder="Loan Amount"
          value={loanAmount}
          onInput={(e) =>
            setLoanAmount(Number((e.target as HTMLInputElement).value) || "")}
          class="w-full p-2 rounded bg-[#1D2A46] text-[#98A9CE] placeholder-[#3D4E73] focus:outline-none"
        />
        <p class="text-[#98A9CE] text-xs sm:text-sm flex items-center justify-center">
          to
        </p>

        {/* Line 2 */}
        <input
          type="text"
          placeholder="Borrower Username"
          value={borrower}
          onInput={(e) => setBorrower((e.target as HTMLInputElement).value)}
          class="w-full p-2 rounded bg-[#1D2A46] text-[#98A9CE] placeholder-[#3D4E73] focus:outline-none"
        />
        <p class="text-[#98A9CE] text-xs sm:text-sm flex items-center justify-center">
          with
        </p>
        <input
          type="number"
          placeholder="Lender Fee"
          value={lenderFee}
          onInput={(e) =>
            setLenderFee(Number((e.target as HTMLInputElement).value) || "")}
          class="w-full p-2 rounded bg-[#1D2A46] text-[#98A9CE] placeholder-[#3D4E73] focus:outline-none"
        />
        <p class="text-[#98A9CE] text-xs sm:text-sm flex items-center justify-center">
          due
        </p>

        {/* Line 3 */}
        <input
          type="date"
          value={dueDate}
          onInput={(e) => setDueDate((e.target as HTMLInputElement).value)}
          class="w-full p-2 rounded bg-[#1D2A46] text-[#98A9CE] placeholder-[#3D4E73] focus:outline-none"
        />
        <p class="text-[#98A9CE] text-xs sm:text-sm flex items-center justify-center">
          using
        </p>
        <select
          value={coverage}
          onInput={(e) => setCoverage((e.target as HTMLSelectElement).value)}
          class="w-full p-2 rounded bg-[#1D2A46] text-[#98A9CE] focus:outline-none"
        >
          <option value="">Select Coverage</option>
          <option value="0.1">10%</option>
          <option value="0.25">25%</option>
          <option value="0.5">50%</option>
          <option value="1.0">100%</option>
        </select>
      </div>
    </div>
  );
}
