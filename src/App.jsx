import React, { useState, useRef, useEffect } from 'react';
    import Papa from 'papaparse';

    function App() {
      const [data, setData] = useState([]);
      const [filteredData, setFilteredData] = useState([]);
      const [search, setSearch] = useState('');
      const [filters, setFilters] = useState({});
      const tableRef = useRef(null);
      const [rowCount, setRowCount] = useState(0);
      const searchInputRef = useRef(null);
      const fileInputRef = useRef(null);
      const [selectedRows, setSelectedRows] = useState([]);
      const [deletedRows, setDeletedRows] = useState([]);
      const [lastDeleted, setLastDeleted] = useState(null);
      const [calculationResult, setCalculationResult] = useState('');
      const [editingCell, setEditingCell] = useState({ row: null, column: null });
      const [cellValue, setCellValue] = useState('');
      const [wiazkaData, setWiazkaData] = useState([]);

      const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
          Papa.parse(file, {
            header: true,
            complete: (results) => {
              const processedData = results.data.filter(row => {
                const keys = Object.keys(row);
                if (keys.length > 3) {
                  const value = parseFloat(row[keys[3]]);
                  return value > 0;
                }
                return true;
              });
              setData(processedData);
              setFilteredData(processedData);
            },
          });
        }
      };

      const handleSearchChange = (event) => {
        const value = event.target.value.toLowerCase();
        setSearch(value);
        applyFiltersAndSearch(value, filters);
      };

      const handleFilterChange = (column, value) => {
        const newFilters = { ...filters, [column]: value.toLowerCase() };
        setFilters(newFilters);
        applyFiltersAndSearch(search, newFilters);
      };

      const applyFiltersAndSearch = (searchValue, currentFilters) => {
        let filtered = [...data];

        if (searchValue) {
          filtered = filtered.filter((row) =>
            Object.values(row).some((value) =>
              String(value).toLowerCase().includes(searchValue)
            )
          );
        }

        for (const column in currentFilters) {
          if (currentFilters[column]) {
            filtered = filtered.filter((row) =>
              String(row[column]).toLowerCase().includes(currentFilters[column])
            );
          }
        }

        setFilteredData(filtered);
        setRowCount(filtered.length);
      };

      const copyFirstColumnValues = () => {
        if (filteredData.length === 0) return;
        const firstColumnHeader = Object.keys(filteredData[0])[0];
        const values = filteredData.map((row) => row[firstColumnHeader]).join('\n');

        const blob = new Blob([values], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = '0lista.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      };

      const copyFirstColumnValuesSave2 = () => {
        if (filteredData.length === 0) return;
        const firstColumnHeader = Object.keys(filteredData[0])[0];
        const secondColumnHeader = Object.keys(filteredData[0])[1];
        const values = filteredData.map((row) => row[firstColumnHeader]).join('\n');
        const firstRowSecondColumn = filteredData[0][secondColumnHeader] || '';
        const filename = `${filteredData.length}-${firstRowSecondColumn}.txt`;

        const blob = new Blob([values], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      };

      const copyFirstResult = () => {
        if (filteredData.length === 0) return;
        const firstColumnHeader = Object.keys(filteredData[0])[0];
        const firstValue = filteredData[0][firstColumnHeader];

        const textArea = document.createElement('textarea');
        textArea.value = firstValue;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
        } catch (err) {
          console.error('Unable to copy', err);
        }
        document.body.removeChild(textArea);
      };

      const copySecondResultThirdColumn = () => {
        if (filteredData.length < 2) return;
        const thirdColumnHeader = Object.keys(filteredData[0])[2];
        const secondValue = filteredData[1][thirdColumnHeader];

        const textArea = document.createElement('textarea');
        textArea.value = secondValue;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
        } catch (err) {
          console.error('Unable to copy', err);
        }
        document.body.removeChild(textArea);
      };

      const clearData = () => {
        setData([]);
        setFilteredData([]);
        setSearch('');
        setFilters({});
        setRowCount(0);
      };

      const reloadData = () => {
        if (fileInputRef.current) {
          fileInputRef.current.value = null;
          setData([]);
          setFilteredData([]);
          setSearch('');
          setFilters({});
          setRowCount(0);
        }
      };

      const handleRowSelect = (index) => {
        if (selectedRows.includes(index)) {
          setSelectedRows(selectedRows.filter((i) => i !== index));
        } else {
          setSelectedRows([...selectedRows, index]);
        }
      };

      const deleteSelectedRows = () => {
        if (selectedRows.length === 0) return;

        const rowsToDelete = selectedRows.sort((a, b) => b - a);
        const newFilteredData = [...filteredData];
        const deleted = [];

        rowsToDelete.forEach((index) => {
          deleted.push(newFilteredData.splice(index, 1)[0]);
        });

        setFilteredData(newFilteredData);
        setData((prevData) => {
          const newData = [...prevData];
          rowsToDelete.forEach((index) => {
            newData.splice(index, 1);
          });
          return newData;
        });
        setDeletedRows([...deletedRows, ...deleted]);
        setLastDeleted(deleted);
        setSelectedRows([]);
        setRowCount(newFilteredData.length);
      };

      const undoDelete = () => {
        if (!lastDeleted || lastDeleted.length === 0) return;

        const newFilteredData = [...filteredData];
        const newData = [...data];

        lastDeleted.forEach((row) => {
          newFilteredData.push(row);
          newData.push(row);
        });

        setFilteredData(newFilteredData);
        setData(newData);
        setDeletedRows(deletedRows.filter((row) => !lastDeleted.includes(row)));
        setLastDeleted(null);
        setRowCount(newFilteredData.length);
      };

      const selectAllRows = () => {
        if (selectedRows.length === filteredData.length) {
          setSelectedRows([]);
        } else {
          setSelectedRows(filteredData.map((_, index) => index));
        }
      };

      const calculateDifference = () => {
        if (selectedRows.length === 0) {
          setCalculationResult('');
          return;
        }

        let totalDifference = 0;
        selectedRows.forEach((index) => {
          if (filteredData[index] && Object.keys(filteredData[index]).length >= 5) {
            const value4 = parseFloat(filteredData[index][Object.keys(filteredData[index])[3]]) || 0;
            const value5 = parseFloat(filteredData[index][Object.keys(filteredData[index])[4]]) || 0;
            totalDifference += value4 - value5;
          }
        });
        setCalculationResult(totalDifference.toFixed(2));
      };

      const handleCellEdit = (row, column, value) => {
        setEditingCell({ row, column });
        setCellValue(value);
      };

      const handleCellChange = (event) => {
        setCellValue(event.target.value);
      };

      const handleCellBlur = () => {
        if (editingCell.row !== null && editingCell.column !== null) {
          const newFilteredData = [...filteredData];
          const newRow = { ...newFilteredData[editingCell.row] };
          const header = Object.keys(newRow)[editingCell.column];
          newRow[header] = cellValue;
          newFilteredData[editingCell.row] = newRow;
          setData((prevData) => {
            const newData = [...prevData];
            const dataRow = { ...newData[editingCell.row] };
            dataRow[header] = cellValue;
            newData[editingCell.row] = dataRow;
            return newData;
          });
          setFilteredData(newFilteredData);
          setEditingCell({ row: null, column: null });
        }
      };

      const handleCellKeyDown = (event) => {
        if (event.key === 'Enter') {
          event.target.blur();
        }
      };

      const updateColumn4WithResult = () => {
        if (selectedRows.length === 0) return;

        const newFilteredData = [...filteredData];
        const newData = [...data];

        selectedRows.forEach((index) => {
          if (newFilteredData[index] && Object.keys(newFilteredData[index]).length >= 4) {
            const header4 = Object.keys(newFilteredData[index])[3];
            newFilteredData[index][header4] = calculationResult;
            newData[index][header4] = calculationResult;
          }
        });

        setFilteredData(newFilteredData);
        setData(newData);
      };

      useEffect(() => {
        calculateDifference();
      }, [selectedRows, filteredData]);

      useEffect(() => {
        if (tableRef.current) {
          const ths = tableRef.current.querySelectorAll('th');
          const tds = tableRef.current.querySelectorAll('td');

          ths.forEach((th) => {
            th.style.width = 'auto';
          });

          tds.forEach((td) => {
            td.style.width = 'auto';
          });

          // Adjust column widths based on content
          if (ths.length > 0 && tds.length > 0) {
            const columnWidths = Array(ths.length).fill(0);

            ths.forEach((th, index) => {
              columnWidths[index] = Math.max(columnWidths[index], th.offsetWidth);
            });

            tds.forEach((td, index) => {
              const columnIndex = index % ths.length;
              columnWidths[columnIndex] = Math.max(columnWidths[columnIndex], td.offsetWidth);
            });

            ths.forEach((th, index) => {
              th.style.width = `${columnWidths[index]}px`;
            });

            tds.forEach((td, index) => {
              const columnIndex = index % ths.length;
              td.style.width = `${columnWidths[columnIndex]}px`;
            });
          }
        }
      }, [filteredData]);

      useEffect(() => {
        const handleKeyDown = (event) => {
          if (event.ctrlKey && event.key === 'f') {
            event.preventDefault();
            searchInputRef.current.focus();
          } else if (event.ctrlKey && event.key === 'c') {
            event.preventDefault();
            copyFirstColumnValues();
          } else if (event.ctrlKey && event.key === 'h') {
            event.preventDefault();
            copyFirstResult();
          } else if (event.ctrlKey && event.key === 'x') {
            event.preventDefault();
            clearData();
          } else if (event.ctrlKey && event.key === 'z') {
            event.preventDefault();
            copySecondResultThirdColumn();
          } else if (event.ctrlKey && event.key === 'd') {
            event.preventDefault();
            deleteSelectedRows();
          } else if (event.ctrlKey && event.key === 'u') {
            event.preventDefault();
            undoDelete();
          } else if (event.ctrlKey && event.key === 'a') {
            event.preventDefault();
            selectAllRows();
          } else if (event.ctrlKey && event.key === 's') {
            event.preventDefault();
            updateColumn4WithResult();
          }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
          window.removeEventListener('keydown', handleKeyDown);
        };
      }, [copyFirstColumnValues, copyFirstResult, clearData, copySecondResultThirdColumn, deleteSelectedRows, undoDelete, selectAllRows, updateColumn4WithResult]);

      useEffect(() => {
        const fetchData = async () => {
          try {
            const response = await fetch('/ddbb3.csv');
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            const text = await response.text();
            Papa.parse(text, {
              header: true,
              complete: (results) => {
                const processedData = results.data.filter(row => {
                  const keys = Object.keys(row);
                  if (keys.length > 3) {
                    const value = parseFloat(row[keys[3]]);
                    return value > 0;
                  }
                  return true;
                });
                setData(processedData);
                setFilteredData(processedData);
              },
            });
          } catch (error) {
            console.error('Failed to load CSV data:', error);
          }
        };

        const fetchWiazkaData = async () => {
          try {
            const response = await fetch('/wiazka.txt');
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            const text = await response.text();
            // Assuming each line in wiazka.txt is a data entry
            const lines = text.split('\n').filter(line => line.trim() !== '');
            setWiazkaData(lines.map((line, index) => ({ id: index, value: line })));
          } catch (error) {
            console.error('Failed to load wiazka.txt data:', error);
            setWiazkaData([]);
          }
        };

        fetchData();
        fetchWiazkaData();
      }, []);

      const wiazkaHeaders = ['ID', 'Value'];

      if (data.length === 0) {
        return (
          <div>
            <input type="file" accept=".csv" onChange={handleFileChange} ref={fileInputRef} />
          </div>
        );
      }

      const headers = Object.keys(data[0]);

      return (
        <div>
          <input type="file" accept=".csv" onChange={handleFileChange} ref={fileInputRef} />
          <input
            type="text"
            placeholder="Search (Ctrl+F)"
            value={search}
            onChange={handleSearchChange}
            ref={searchInputRef}
          />
          <button onClick={copyFirstColumnValues}>Save First Column (Ctrl+C)</button>
          <button onClick={copyFirstResult}>Copy First Result (Ctrl+H)</button>
          <button onClick={clearData}>Clear (Ctrl+X)</button>
          <button onClick={reloadData}>Reload</button>
          <button onClick={copyFirstColumnValuesSave2}>Save2</button>
          <button onClick={copySecondResultThirdColumn}>Lot-2 (Ctrl+Z)</button>
          <button onClick={deleteSelectedRows}>Delete Selected (Ctrl+D)</button>
          <button onClick={undoDelete}>Undo Delete (Ctrl+U)</button>
          <button onClick={selectAllRows}>Select All (Ctrl+A)</button>
          <button onClick={updateColumn4WithResult}>Update Column 4 (Ctrl+S)</button>
          <div>
            <span>Rows: {rowCount}</span>
          </div>
          {calculationResult && (
            <div>
              <span>Result:</span>
              <input type="text" value={calculationResult} readOnly />
            </div>
          )}
          <table ref={tableRef}>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectedRows.length === filteredData.length}
                    onChange={selectAllRows}
                  />
                </th>
                {headers.map((header) => (
                  <th key={header}>
                    <div>
                      {header}
                      <input
                        type="text"
                        placeholder="Filter..."
                        onChange={(e) => handleFilterChange(header, e.target.value)}
                      />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, index) => (
                <tr
                  key={index}
                  style={{
                    backgroundColor: selectedRows.includes(index) ? '#444' : 'transparent',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleRowSelect(index)}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(index)}
                      onChange={() => handleRowSelect(index)}
                      style={{ pointerEvents: 'none' }}
                    />
                  </td>
                  {headers.map((header, colIndex) => (
                    <td key={header} onClick={(e) => {
                      e.stopPropagation();
                      handleCellEdit(index, colIndex, row[header])
                    }}>
                      {editingCell.row === index && editingCell.column === colIndex ? (
                        <input
                          type="text"
                          value={cellValue}
                          onChange={handleCellChange}
                          onBlur={handleCellBlur}
                          onKeyDown={handleCellKeyDown}
                          autoFocus
                        />
                      ) : (
                        row[header]
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <h2>Wiazka Data</h2>
          <table>
            <thead>
              <tr>
                {wiazkaHeaders.map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {wiazkaData.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    export default App;
