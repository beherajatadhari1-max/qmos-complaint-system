                    <td className="px-1 py-1 border border-gray-200">
                            <Input
                              value={s.productChars}
                              onChange={v => setStep(s.id, 'productChars', v)}
                              placeholder="e.g. Diameter, Hardness"
                            />
                          </td>

                          {/* Process Chars */}
                          <td className="px-1 py-1 border border-gray-200">
                            <Input
                              value={s.processChars}
                              onChange={v => setStep(s.id, 'processChars', v)}
                              placeholder="e.g. Feed rate, Temperature"
                            />
                          </td>

                          {/* Special Char */}
                          <td className="px-1 py-1 border border-gray-200" style={{ width: 120 }}>
                            <select
                              value={s.specialCharClass}
                              onChange={e => setStep(s.id, 'specialCharClass', e.target.value)}
                              className="w-full border border-gray-300 rounded px-1 py-1 text-xs focus:outline-none"
                            >
                              {SPECIAL_CHAR_OPTIONS.map(o => (
                                <option key={o} value={o}>{o || '— None —'}</option>
                              ))}
                            </select>
                          </td>

                          {/* Incoming Material */}
                          <td className="px-1 py-1 border border-gray-200">
                            <Input
                              value={s.incomingMaterial}
                              onChange={v => setStep(s.id, 'incomingMaterial', v)}
                              placeholder="e.g. Raw bar stock, Sub-assembly A"
                            />
                          </td>

                          {/* Comments */}
                          <td className="px-1 py-1 border border-gray-200">
                            <Input
                              value={s.comments}
                              onChange={v => setStep(s.id, 'comments', v)}
                              placeholder="Notes / remarks"
                            />
                          </td>

                          {/* Actions */}
                          <td className="px-1 py-1 border border-gray-200 text-center" style={{ width: 90 }}>
                            <div className="flex items-center justify-center gap-0.5">
                              <button
                                onClick={() => moveStep(s.id, -1)}
                                disabled={idx === 0}
                                title="Move up"
                                className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-gray-500"
                              >▲</button>
                              <button
                                onClick={() => moveStep(s.id, 1)}
                                disabled={idx === steps.length - 1}
                                title="Move down"
                                className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-gray-500"
                              >▼</button>
                              <button
                                onClick={() => dupStep(s.id)}
                                title="Duplicate"
                                className="p-1 rounded hover:bg-blue-50 text-blue-500"
                              >⧉</button>
                              <button
                                onClick={() => delStep(s.id)}
                                title="Delete"
                                className="p-1 rounded hover:bg-red-50 text-red-500"
                              >✕</button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={addStep}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  + Add Process Step
                </button>
                <span className="text-xs text-gray-400">
                  {steps.length} step{steps.length !== 1 ? 's' : ''} total
                </span>
              </div>
            </div>

            {/* Flow Summary */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Flow Summary</h3>
              <div className="flex flex-wrap items-center gap-1">
                {steps.map((s, idx) => {
                  const ot = OP_TYPES[s.opType]
                  return (
                    <div key={s.id} className="flex items-center gap-1">
                      <div
                        className="flex flex-col items-center rounded-lg border px-2 py-1 text-xs"
                        style={{ borderColor: ot.color, backgroundColor: ot.bg }}
                      >
                        <span className="font-bold text-base leading-none" style={{ color: ot.color }}>
                          {ot.symbol}
                        </span>
                        <span className="text-gray-600 max-w-[80px] truncate text-center mt-0.5">
                          {s.processName || `Step ${s.stepNo}`}
                        </span>
                      </div>
                      {idx < steps.length - 1 && (
                        <span className="text-gray-400 font-bold">→</span>
                      )}
                    </div>
                  )
                })}
                {steps.length === 0 && (
                  <span className="text-gray-400 text-sm">No steps yet. Add steps above.</span>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
